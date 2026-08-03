 import {
  LayoutDashboard,
  Database,
  BrainCircuit,
  Bot,
  BarChart3,
  UserCircle,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}



export default function Sidebar({
  collapsed,
  mobileOpen,
  onClose,
}: SidebarProps) {


  const navigate = useNavigate();

  const { logout } = useAuth();



  function handleLogout() {

    logout();

    navigate("/");

  }



  return (

    <aside
  className={`
    fixed inset-y-0 left-0 z-50
    flex flex-col bg-slate-900 border-r border-slate-800
    transition-transform duration-300

    w-72

    ${
      mobileOpen
        ? "translate-x-0"
        : "-translate-x-full"
    }

    lg:static
    lg:translate-x-0
    ${collapsed ? "lg:w-20" : "lg:w-72"}
  `}
>



      {/* Branding */}

      <div
        className={`
          border-b border-slate-800
          transition-all
          ${collapsed ? "p-4 text-center" : "p-6"}
        `}
      >

        <h1 className="text-2xl font-bold text-cyan-400">

          {collapsed ? "D" : "DIRALIS"}

        </h1>



        {!collapsed && (

          <p className="mt-1 text-sm text-slate-400">

            AI Business Intelligence

          </p>

        )}

      </div>





      {/* Navigation */}

      <nav className="space-y-2 p-4">


        <SidebarLink
          to="/dashboard"
          icon={<LayoutDashboard size={20} />}
          title="Dashboard"
          collapsed={collapsed}
          onClick={onClose}
        />


        <SidebarLink
          to="/datasets"
          icon={<Database size={20} />}
          title="Datasets"
          collapsed={collapsed}
          onClick={onClose}
        />


        <SidebarLink
          to="/ai-insights"
          icon={<BrainCircuit size={20} />}
          title="AI Insights"
          collapsed={collapsed}
          onClick={onClose}
        />


        <SidebarLink
          to="/chat"
          icon={<Bot size={20} />}
          title="AI Chat"
          collapsed={collapsed}
          onClick={onClose}
        />


        <SidebarLink
          to="/reports"
          icon={<BarChart3 size={20} />}
          title="Reports"
          collapsed={collapsed}
          onClick={onClose}
        />


        <SidebarLink
          to="/profile"
          icon={<UserCircle size={20} />}
          title="Profile"
          collapsed={collapsed}
          onClick={onClose}
        />


        <SidebarLink
          to="/settings"
          icon={<Settings size={20} />}
          title="Settings"
          collapsed={collapsed}
          onClick={onClose}
        />


      </nav>





      {/* Actions */}

      <div className="mx-4 border-t border-slate-800 pt-4 space-y-2">


        <button

          onClick={() => navigate("/")}

          className={`
            flex w-full items-center gap-3 rounded-lg px-4 py-3
            text-slate-300 transition
            hover:bg-slate-800 hover:text-white
            ${collapsed ? "justify-center" : ""}
          `}

        >

          🌐


          {!collapsed && (

            <span>
              Visit Website
            </span>

          )}

        </button>





        <button

          onClick={handleLogout}

          className={`
            flex w-full items-center gap-3 rounded-lg px-4 py-3
            text-red-400 transition
            hover:bg-red-500/10
            ${collapsed ? "justify-center" : ""}
          `}

        >

          <LogOut size={20} />


          {!collapsed && (

            <span>
              Logout
            </span>

          )}

        </button>


      </div>


    </aside>

  );

}





interface SidebarLinkProps {

  to: string;

  icon: React.ReactNode;

  title: string;

  collapsed: boolean;

  onClick?: () => void;

}





function SidebarLink({

  to,

  icon,

  title,

  collapsed,

   onClick,

}: SidebarLinkProps) {


  return (

    <NavLink

      to={to}
      onClick={onClick}

      className={({ isActive }) =>

        `
        flex items-center gap-3 rounded-lg px-4 py-3 transition
        ${collapsed ? "justify-center" : ""}
        ${
          isActive

          ? "bg-cyan-500/15 text-cyan-400 border-l-4 border-cyan-500"

          : "text-slate-300 hover:bg-slate-800 hover:text-white"

        }
        `

      }

    >

      {icon}


      {!collapsed && (

        <span>
          {title}
        </span>

      )}


    </NavLink>

  );

}

