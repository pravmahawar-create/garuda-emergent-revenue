import React from "react";
import { NavLink } from "react-router-dom";
import { ChartLineUp, Target, RocketLaunch, Wallet } from "@phosphor-icons/react";

const items = [
  { to: "/dashboard", label: "Home", icon: ChartLineUp },
  { to: "/opportunities", label: "Pipeline", icon: Target },
  { to: "/missions", label: "Mission", icon: RocketLaunch },
  { to: "/settlements", label: "Payout", icon: Wallet },
];

export default function MobileDock() {
  return <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-gborder bg-bg/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
    {items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 py-1 text-[10px] uppercase tracking-wider ${isActive ? "text-gold" : "text-text_muted"}`}>
      <Icon size={21} weight="fill" /><span>{label}</span>
    </NavLink>)}
  </nav>;
}
