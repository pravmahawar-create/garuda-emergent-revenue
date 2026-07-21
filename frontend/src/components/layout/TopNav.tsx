import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Bell, MagnifyingGlass, SignOut, CaretDown } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Notification } from "@/types";
import { NAV } from "@/constants/testIds";
import { formatRelative } from "@/lib/format";

const pageTitles: Record<string, { eyebrow: string; title: string }> = {
  "/dashboard": { eyebrow: "Overview", title: "Central Dashboard" },
  "/opportunities": { eyebrow: "Pipeline", title: "Opportunity Manager" },
  "/tasks": { eyebrow: "Execution", title: "Task Manager" },
  "/revenue": { eyebrow: "Earnings", title: "Revenue Records" },
  "/settlements": { eyebrow: "Payout", title: "Settlement Ledger" },
  "/missions": { eyebrow: "Command", title: "Income Mission" },
  "/analytics": { eyebrow: "Insight", title: "Revenue Analytics" },
  "/activity": { eyebrow: "Signal", title: "Activity Timeline" },
  "/notifications": { eyebrow: "Inbox", title: "Notifications" },
  "/settings": { eyebrow: "System", title: "Settings" },
};

export default function TopNav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const meta = pageTitles[loc.pathname] || { eyebrow: "Garuda", title: "Console" };

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<Notification[]>("/notifications")).data,
    refetchInterval: 30000,
  });

  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onLogout = async () => {
    await logout();
    nav("/login");
  };

  return (
    <header
      data-testid={NAV.topNav}
      className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gborder bg-bg/85 px-6 backdrop-blur-xl sm:px-10"
    >
      <div className="flex flex-1 items-center gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-text_muted">{meta.eyebrow}</div>
          <div className="font-heading text-lg tracking-tight text-text_primary">{meta.title}</div>
        </div>
        <div className="ml-auto hidden max-w-md flex-1 md:block">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text_muted"
            />
            <input
              type="text"
              placeholder="Search opportunities, tasks, clients…"
              className="w-full rounded-sm border border-gborder bg-elevated/60 py-2 pl-9 pr-3 text-sm text-text_primary outline-none placeholder:text-text_muted focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="relative" ref={bellRef}>
        <button
          data-testid={NAV.notificationBell}
          onClick={() => setOpen((o) => !o)}
          className="relative flex h-9 w-9 items-center justify-center rounded-sm border border-gborder bg-elevated/60 text-text_secondary hover:text-gold hover:border-gold transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-bg">
              {unread}
            </span>
          )}
        </button>
        {open && (
          <div
            data-testid={NAV.notificationDropdown}
            className="absolute right-0 mt-2 w-80 overflow-hidden rounded-md border border-gborder bg-surface shadow-card"
          >
            <div className="flex items-center justify-between border-b border-gborder px-4 py-3">
              <div className="font-heading text-sm text-text_primary">Notifications</div>
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-gold hover:text-gold-hi transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 && (
                <div className="p-6 text-center text-sm text-text_muted">No notifications yet.</div>
              )}
              {notifs.slice(0, 6).map((n) => (
                <div
                  key={n.id}
                  className="border-b border-gborder px-4 py-3 last:border-0 hover:bg-elevated/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        n.level === "warning"
                          ? "bg-state-warning"
                          : n.level === "critical"
                          ? "bg-state-danger"
                          : n.level === "success"
                          ? "bg-state-success"
                          : "bg-gold"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-text_primary">{n.title}</div>
                      <div className="mt-0.5 text-[11px] text-text_muted">{formatRelative(n.createdAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          data-testid="top-nav-profile-menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-sm border border-gborder bg-elevated/60 px-2 py-1.5 text-sm text-text_primary hover:border-gold transition-colors"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[11px] font-semibold text-bg">
            {(user?.name || "?").charAt(0).toUpperCase()}
          </div>
          <span className="hidden max-w-[140px] truncate font-body sm:inline">{user?.name}</span>
          <CaretDown size={12} className="text-text_muted" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-gborder bg-surface shadow-card">
            <div className="border-b border-gborder px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-text_muted">Signed in</div>
              <div className="mt-1 truncate text-sm text-text_primary">{user?.email}</div>
            </div>
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-text_secondary hover:bg-elevated hover:text-text_primary transition-colors"
            >
              Settings
            </Link>
            <button
              data-testid={NAV.logoutBtn}
              onClick={onLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text_secondary hover:bg-elevated hover:text-state-danger transition-colors"
            >
              <SignOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
