import { useState } from "react";
import type { ReactNode } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import FloatingWhatsApp from "../common/FloatingWhatsApp";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({
  children,
}: AppLayoutProps) {

  const [sidebarCollapsed, setSidebarCollapsed] =
  useState(false);

const [mobileSidebarOpen, setMobileSidebarOpen] =
  useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">

      <Sidebar
  collapsed={sidebarCollapsed}
  mobileOpen={mobileSidebarOpen}
  onClose={() => setMobileSidebarOpen(false)}
/>

   {mobileSidebarOpen && (
  <div
    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
    onClick={() => setMobileSidebarOpen(false)}
  />
)}

      <div className="flex min-w-0 flex-1 flex-col">

        <Topbar
  onMenuClick={() => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  }}
/>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>

      <FloatingWhatsApp />

    </div>
  );
}

