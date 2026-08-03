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

  // Desktop sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  // Mobile drawer
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  function handleMenuClick() {

    if (window.innerWidth < 1024) {

      setMobileSidebarOpen(!mobileSidebarOpen);

    } else {

      setSidebarCollapsed(!sidebarCollapsed);

    }
  }

  return (

    <div className="min-h-screen bg-slate-950 text-white lg:flex">

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        closeMobileSidebar={() =>
          setMobileSidebarOpen(false)
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">

        <Topbar
          onMenuClick={handleMenuClick}
        />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>

      <FloatingWhatsApp />

    </div>

  );
}

