import React from "react";
import { NavLink } from "react-router-dom";
import {
  ChartLineUp,
  Target,
  ListChecks,
  CurrencyCircleDollar,
  ChartPieSlice,
  ClockCounterClockwise,
  Bell,
  Gear,
  CircleWavyCheck,
  Wallet,
  RocketLaunch,
} from "@phosphor-icons/react";
import { NAV } from "@/constants/testIds";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: ChartLineUp, tid: NAV.linkDashboard },
  { to: "/opportunities", label: "Opportunities", icon: Target, tid: NAV.linkOpportunities },
  { to: "/tasks", label: "Task Manager", icon: ListChecks, tid: NAV.linkTasks },
  { to: "/revenue", label: "Earnings", icon: CurrencyCircleDollar, tid: NAV.linkRevenue },
  { to: "/settlements", label: "Settlements", icon: Wallet, tid: NAV.linkSettlements },
  { to: "/missions", label: "Income Mission", icon: RocketLaunch, tid: NAV.linkMissions },
  { to: "/analytics", label: "Revenue Analytics", icon: ChartPieSlice, tid: NAV.linkAnalytics },
  { to: "/activity", label: "Activity Timeline", icon: ClockCounterClockwise, tid: NAV.linkActivity },
];

const secondary = [
  { to: "/notifications", label: "Notifications", icon: Bell, tid: NAV.linkNotifications },
  { to: "/settings", label: "Settings", icon: Gear, tid: NAV.linkSettings },
];

export default function Sidebar() {
  return (
    <aside
      data-testid={NAV.sidebar}
      className="sticky top-0 z-40 hidden h-screen w-64 shrink-0 flex-col border-r border-gborder bg-bg lg:flex"
    >
      <div className="flex h-16 items-center gap-3 border-b border-gborder px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-gold/40 bg-bg">
          <span className="font-heading text-lg text-gold">G</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-heading text-base tracking-tight">GARUDA</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-text_muted">Revenue Universe</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-2 px-3 text-[10px] uppercase tracking-[0.22em] text-text_muted">
          Command
        </div>
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon, tid }) => (
            <li key={to}>
              <NavLink
                to={to}
                data-testid={tid}
                className={({ isActive }) =>
                  [
                    "group relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-elevated text-text_primary"
                      : "text-text_secondary hover:bg-elevated hover:text-text_primary",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-r bg-gold" />
                    )}
                    <Icon size={18} weight={isActive ? "fill" : "regular"} color={isActive ? "#D4AF37" : undefined} />
                    <span className="font-body">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-8 mb-2 px-3 text-[10px] uppercase tracking-[0.22em] text-text_muted">
          System
        </div>
        <ul className="space-y-1">
          {secondary.map(({ to, label, icon: Icon, tid }) => (
            <li key={to}>
              <NavLink
                to={to}
                data-testid={tid}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-elevated text-text_primary"
                      : "text-text_secondary hover:bg-elevated hover:text-text_primary",
                  ].join(" ")
                }
              >
                <Icon size={18} />
                <span className="font-body">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gborder p-4">
        <div className="flex items-center gap-3 rounded-sm border border-gborder bg-elevated/50 px-3 py-3">
          <CircleWavyCheck size={20} color="#4ADE80" weight="fill" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-widest text-text_muted">Status</div>
            <div className="truncate font-body text-sm text-text_primary">All systems nominal</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
