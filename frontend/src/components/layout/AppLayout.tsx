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

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">

      <Sidebar
        collapsed={sidebarCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">

        <Topbar
          onMenuClick={() =>
            setSidebarCollapsed(!sidebarCollapsed)
          }
        />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>

      <FloatingWhatsApp />

    </div>
  );
}

