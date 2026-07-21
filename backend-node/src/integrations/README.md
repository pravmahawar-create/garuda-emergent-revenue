# GARUDA AI — Integration Points

This directory contains adapter contracts for GARUDA subsystems. Existing
stubs remain available for Mother Brain, Knowledge Engine, Guardian, Creative
Universe, and autonomous agents.

The Emergent Revenue workspace remains the authenticated presentation layer. GARUDA Core remains the authoritative Revenue and Settlement engine.

Set `GARUDA_CORE_URL` in `backend/.env` (default: `http://127.0.0.1:3000`). The adapter exposes authenticated, read-only endpoints:

- `GET /api/garuda-core/status`
- `GET /api/garuda-core/revenue`
- `GET /api/garuda-core/settlements`

Settlement mutations and Founder approval headers are intentionally not proxied to the browser.

The remaining adapters are invoked through `services/eventBus.ts` and can be
activated without changing Revenue Universe domain modules.
