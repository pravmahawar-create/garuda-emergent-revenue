import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/api";
import { AUTH } from "@/constants/testIds";
import { Eye, EyeSlash } from "@phosphor-icons/react";

const AUTH_BG =
  "https://images.pexels.com/photos/20576695/pexels-photo-20576695.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@garuda.ai");
  const [password, setPassword] = useState("Garuda@2026");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (e: any) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg text-text_primary">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-5">
        {/* Split hero */}
        <div className="relative hidden lg:col-span-3 lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${AUTH_BG})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-gold/40 bg-bg/50">
                <span className="font-heading text-lg text-gold">G</span>
              </div>
              <div className="font-heading text-2xl tracking-tight">GARUDA</div>
              <span className="ml-2 rounded-sm border border-gborder px-2 py-0.5 text-[10px] uppercase tracking-widest text-text_muted">
                AI Operating System
              </span>
            </div>
            <div className="max-w-xl">
              <div className="mb-4 text-xs uppercase tracking-[0.3em] text-gold">
                Revenue Universe
              </div>
              <h1 className="font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl">
                The operator console for building
                <span className="text-gold"> billion-dollar</span> revenue trajectories.
              </h1>
              <p className="mt-6 max-w-md font-body text-base leading-relaxed text-text_secondary">
                Convert opportunities. Command tasks. Record earnings. Every interaction
                feeds the Mother Brain — so every decision compounds.
              </p>
            </div>
            <div className="grid max-w-lg grid-cols-3 gap-6 text-text_muted">
              <MetricStub label="Pipeline Value" value="$2.3B+" />
              <MetricStub label="Modules" value="9" />
              <MetricStub label="Agents Ready" value="∞" />
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="col-span-1 flex items-center justify-center px-6 py-12 lg:col-span-2 lg:px-12">
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-gold/40 bg-bg/50">
                <span className="font-heading text-lg text-gold">G</span>
              </div>
              <span className="font-heading text-xl">GARUDA</span>
            </div>

            <div className="g-label mb-3">Secure sign in</div>
            <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">Welcome back.</h2>
            <p className="mt-3 font-body text-sm text-text_secondary">
              Enter your credentials to access the Revenue Universe.
            </p>

            <form onSubmit={onSubmit} className="mt-10 space-y-5">
              <div>
                <label className="g-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  data-testid={AUTH.loginEmail}
                  className="g-input mt-2 w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="g-label" htmlFor="password">Password</label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    data-testid={AUTH.loginPassword}
                    className="g-input w-full pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text_muted hover:text-gold transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {err && (
                <div
                  data-testid={AUTH.loginError}
                  className="rounded-sm border border-state-danger/40 bg-state-danger/10 px-4 py-3 text-sm text-state-danger"
                >
                  {err}
                </div>
              )}

              <button
                type="submit"
                data-testid={AUTH.loginSubmit}
                disabled={busy}
                className="g-btn-primary w-full"
              >
                {busy ? "Authenticating…" : "Enter Garuda"}
              </button>
            </form>

            <div className="mt-8 text-sm text-text_muted">
              New operator?{" "}
              <Link
                to="/register"
                data-testid={AUTH.gotoRegister}
                className="text-gold hover:text-gold-hi transition-colors"
              >
                Request an account →
              </Link>
            </div>

            <div className="mt-10 rounded-sm border border-gborder bg-elevated/50 p-4 text-xs text-text_muted">
              <div className="mb-1 uppercase tracking-widest text-text_secondary">Demo credentials</div>
              admin@garuda.ai · Garuda@2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricStub({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-heading text-2xl text-text_primary">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-text_muted">{label}</div>
    </div>
  );
}
