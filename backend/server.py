"""GARUDA AI — FastAPI supervisor shim.

The environment's supervisor is locked to `uvicorn server:app` on port 8001,
but GARUDA AI's real backend is a Node.js + Express + TypeScript service
living in /app/backend-node. This shim:

  1. Boots the Node.js backend as a managed child process on internal port 4001.
  2. Reverse-proxies every `/api/*` request from :8001 to the Node backend.
  3. Passes through cookies, headers, query strings, and request bodies
     transparently so JWT auth cookies work end-to-end.

Nothing else in this file is business logic — all real code lives in
/app/backend-node/src.
"""
from __future__ import annotations

import asyncio
import os
import signal
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

NODE_DIR = Path("/app/backend-node")
NODE_PORT = int(os.environ.get("NODE_PORT", "4001"))
NODE_URL = f"http://127.0.0.1:{NODE_PORT}"

_node_proc: subprocess.Popen | None = None
_http_client: httpx.AsyncClient | None = None


async def _wait_for_node(timeout: float = 60.0) -> None:
    """Poll the node health endpoint until it responds or timeout."""
    deadline = asyncio.get_event_loop().time() + timeout
    async with httpx.AsyncClient(timeout=2.0) as client:
        while asyncio.get_event_loop().time() < deadline:
            try:
                r = await client.get(f"{NODE_URL}/health")
                if r.status_code == 200:
                    return
            except httpx.HTTPError:
                pass
            await asyncio.sleep(0.5)
    raise RuntimeError("Node backend failed to start within timeout")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _node_proc, _http_client

    # Ensure node dependencies are installed
    if not (NODE_DIR / "node_modules").exists():
        subprocess.run(["yarn", "install"], cwd=str(NODE_DIR), check=True)

    env = {**os.environ, "NODE_PORT": str(NODE_PORT)}
    _node_proc = subprocess.Popen(
        ["yarn", "start"],
        cwd=str(NODE_DIR),
        env=env,
        preexec_fn=os.setsid,
    )
    try:
        await _wait_for_node()
    except Exception as e:
        print(f"[shim] Node backend failed to become healthy: {e}")
    _http_client = httpx.AsyncClient(timeout=30.0, base_url=NODE_URL)

    try:
        yield
    finally:
        if _http_client is not None:
            await _http_client.aclose()
        if _node_proc is not None and _node_proc.poll() is None:
            try:
                os.killpg(os.getpgid(_node_proc.pid), signal.SIGTERM)
                _node_proc.wait(timeout=10)
            except Exception:
                _node_proc.kill()


app = FastAPI(lifespan=lifespan, title="GARUDA AI Shim")


@app.get("/")
async def root():
    return {"service": "garuda-shim", "backend": "node-express"}


_HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request):
    assert _http_client is not None
    body = await request.body()
    fwd_headers = {
        k: v for k, v in request.headers.items() if k.lower() not in _HOP_BY_HOP
    }
    try:
        upstream = await _http_client.request(
            request.method,
            f"/api/{path}",
            content=body if body else None,
            headers=fwd_headers,
            params=request.query_params,
            cookies={},  # prevent httpx from persisting/leaking cookies across requests
        )
    except httpx.RequestError as e:
        return Response(
            content=f'{{"error":"upstream_unreachable","detail":"{e}"}}',
            status_code=502,
            media_type="application/json",
        )
    finally:
        # Also clear the shared client's cookie jar so no state persists between requests.
        try:
            _http_client.cookies.clear()  # type: ignore[union-attr]
        except Exception:
            pass

    # Preserve multi-value headers (esp. multiple Set-Cookie) by building the
    # response then appending headers using MutableHeaders.append which allows
    # duplicate header names.
    resp = Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=upstream.headers.get("content-type"),
    )
    # Remove default headers that we'll set from upstream (content-type set via media_type).
    del resp.headers["content-length"]
    for k, v in upstream.headers.multi_items():
        lk = k.lower()
        if lk in _HOP_BY_HOP:
            continue
        if lk == "content-type":
            continue  # already set via media_type
        resp.raw_headers.append((lk.encode("latin-1"), v.encode("latin-1")))
    return resp
