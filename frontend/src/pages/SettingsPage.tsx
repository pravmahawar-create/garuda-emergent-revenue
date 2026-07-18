import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { SETTINGS } from "@/constants/testIds";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [busyProfile, setBusyProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busyPw, setBusyPw] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyProfile(true);
    try {
      const { data } = await api.patch("/settings/profile", { name, avatarUrl });
      setUser(data);
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(formatApiError(e));
    } finally {
      setBusyProfile(false);
    }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyPw(true);
    try {
      await api.post("/settings/change-password", { currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      toast.error(formatApiError(e));
    } finally {
      setBusyPw(false);
    }
  };

  return (
    <div data-testid={SETTINGS.page} className="animate-fade-in-up space-y-6">
      <div>
        <div className="g-label">System</div>
        <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-2 max-w-xl text-sm text-text_secondary">
          Operator profile and security. Team, integrations, and workspace controls arrive with the next module.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <form onSubmit={saveProfile} className="g-card space-y-4 p-6">
          <div>
            <div className="g-label">Profile</div>
            <h3 className="mt-1 font-heading text-xl tracking-tight">Operator identity</h3>
          </div>
          <div>
            <label className="g-label">Name</label>
            <input
              data-testid={SETTINGS.nameInput}
              className="g-input mt-2 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="g-label">Email</label>
            <input className="g-input mt-2 w-full opacity-60" value={user?.email || ""} disabled />
          </div>
          <div>
            <label className="g-label">Avatar URL</label>
            <input
              className="g-input mt-2 w-full"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              data-testid={SETTINGS.saveProfile}
              disabled={busyProfile}
              className="g-btn-primary"
            >
              {busyProfile ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>

        <form onSubmit={changePw} className="g-card space-y-4 p-6">
          <div>
            <div className="g-label">Security</div>
            <h3 className="mt-1 font-heading text-xl tracking-tight">Change password</h3>
          </div>
          <div>
            <label className="g-label">Current password</label>
            <input
              data-testid={SETTINGS.currentPassword}
              type="password"
              className="g-input mt-2 w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="g-label">New password</label>
            <input
              data-testid={SETTINGS.newPassword}
              type="password"
              minLength={6}
              className="g-input mt-2 w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              data-testid={SETTINGS.changePassword}
              disabled={busyPw}
              className="g-btn-primary"
            >
              {busyPw ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>

      <div className="g-card p-6">
        <div className="g-label">Future subsystems</div>
        <h3 className="mt-1 font-heading text-xl tracking-tight">Ready to plug in</h3>
        <p className="mt-2 text-sm text-text_secondary">
          The Revenue Universe is architected to receive:
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            "Mother Brain",
            "Knowledge Engine",
            "Guardian",
            "Creative Universe",
            "AI Agents",
          ].map((m) => (
            <div key={m} className="rounded-sm border border-gborder bg-elevated/40 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-text_muted">Module</div>
              <div className="mt-1 font-heading text-sm text-text_primary">{m}</div>
              <div className="mt-2 text-[11px] text-gold">Adapter ready</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
