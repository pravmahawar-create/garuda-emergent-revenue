import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/api";
import { AUTH } from "@/constants/testIds";

export default function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await register(name, email, password);
      nav("/dashboard");
    } catch (e: any) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text_primary flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-gold/40 bg-bg/50">
            <span className="font-heading text-lg text-gold">G</span>
          </div>
          <span className="font-heading text-xl tracking-tight">GARUDA</span>
        </div>
        <div className="g-label mb-3">Provisioning</div>
        <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">Request an operator seat.</h2>
        <p className="mt-3 font-body text-sm text-text_secondary">
          Every operator gets their own isolated Revenue Universe. No shared state, no leaks.
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <div>
            <label className="g-label">Name</label>
            <input
              type="text"
              data-testid={AUTH.registerName}
              className="g-input mt-2 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label className="g-label">Email</label>
            <input
              type="email"
              data-testid={AUTH.registerEmail}
              className="g-input mt-2 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="g-label">Password</label>
            <input
              type="password"
              data-testid={AUTH.registerPassword}
              className="g-input mt-2 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
            <p className="mt-2 text-xs text-text_muted">Minimum 6 characters.</p>
          </div>
          {err && (
            <div
              data-testid={AUTH.registerError}
              className="rounded-sm border border-state-danger/40 bg-state-danger/10 px-4 py-3 text-sm text-state-danger"
            >
              {err}
            </div>
          )}
          <button
            type="submit"
            data-testid={AUTH.registerSubmit}
            disabled={busy}
            className="g-btn-primary w-full"
          >
            {busy ? "Creating seat…" : "Create operator seat"}
          </button>
        </form>

        <div className="mt-8 text-sm text-text_muted">
          Existing operator?{" "}
          <Link to="/login" data-testid={AUTH.gotoLogin} className="text-gold hover:text-gold-hi transition-colors">
            Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}
