import { useState } from "react";
import type { ReactNode } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";


interface AppLayoutProps {
  children: ReactNode;
}



export default function AppLayout({
  children,
}: AppLayoutProps) {


  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);



  return (

    <div className="flex min-h-screen bg-slate-950 text-white">


      <Sidebar
        collapsed={sidebarCollapsed}
      />



      <div className="flex flex-1 flex-col">


        <Topbar

          onMenuClick={() =>
            setSidebarCollapsed(
              !sidebarCollapsed
            )
          }

        />



        <main className="flex-1 overflow-auto p-8">

          {children}

        </main>


      </div>


    </div>

  );

}

