import type { ReactNode } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">

      <Sidebar />

      <div className="flex flex-1 flex-col">

        <Topbar />

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>

      </div>

    </div>
  );
}


