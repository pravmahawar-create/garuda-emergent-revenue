import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import MobileDock from "@/components/layout/MobileDock";

export default function AppShell() {
  return (
    <div className="relative min-h-screen bg-bg text-text_primary">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopNav />
          <main className="flex-1 overflow-x-hidden pb-20 lg:pb-0">
            <div className="mx-auto w-full max-w-[1400px] px-6 py-8 sm:px-10 sm:py-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <MobileDock />
    </div>
  );
}
