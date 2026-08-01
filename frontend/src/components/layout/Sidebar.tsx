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

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside className="flex w-72 flex-col border-r border-slate-800 bg-slate-900">

      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-cyan-400">
          DIRALIS
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          AI Business Intelligence
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">

        <SidebarLink
          to="/dashboard"
          icon={<LayoutDashboard size={20} />}
          title="Dashboard"
        />

        <SidebarLink
          to="/datasets"
          icon={<Database size={20} />}
          title="Datasets"
        />

        <SidebarLink
          to="/ai-insights"
          icon={<BrainCircuit size={20} />}
          title="AI Insights"
        />

        <SidebarLink
        to="/chat"
        icon={<Bot size={20} />}
        title="AI Chat"
        />

        <SidebarLink
          to="/reports"
          icon={<BarChart3 size={20} />}
          title="Reports"
        />

        <SidebarLink
          to="/profile"
          icon={<UserCircle size={20} />}
          title="Profile"
        />

        <SidebarLink
          to="/settings"
          icon={<Settings size={20} />}
          title="Settings"
        />

      </nav>


    </aside>
  );
}

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  title: string;
}

function SidebarLink({
  to,
  icon,
  title,
}: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
          isActive
            ? "bg-cyan-500/15 text-cyan-400 border-l-4 border-cyan-500"
            : "hover:bg-slate-800"
        }`
      }
    >
      {icon}
      <span>{title}</span>
    </NavLink>
  );
}

