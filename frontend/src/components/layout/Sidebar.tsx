import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Database,
  BrainCircuit,
  Bot,
  BarChart3,
  CreditCard,
  UserCircle,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getBillingOverview, type BillingOverview } from "../../services/billingService";

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
  const { logout, token } = useAuth();
  const [overview, setOverview] = useState<BillingOverview | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    getBillingOverview()
      .then((data) => {
        if (isMounted) setOverview(data);
      })
      .catch((err) => {
        console.error("Failed to load sidebar plan info:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const planName = overview?.plan?.name ?? "Free";
  const isProOrAbove = overview?.hasActiveSubscription;

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        flex flex-col bg-slate-900 border-r border-slate-800
        transition-transform duration-300
        w-72
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
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
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
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
          to="/billing"
          icon={<CreditCard size={20} />}
          title="Billing"
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

      {/* Embedded Subscription Tier Card */}
      {!collapsed && (
        <div className="mx-4 my-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" />
              {planName} Plan
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                isProOrAbove
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {isProOrAbove ? "Active" : "Free Tier"}
            </span>
          </div>
          <p className="mt-1.5 text-slate-400 text-[11px]">
            {isProOrAbove
              ? "All premium features unlocked."
              : "Upgrade to unlock advanced AI models and higher quotas."}
          </p>
          <Link
            to="/billing"
            onClick={onClose}
            className="mt-2.5 block text-center rounded-lg bg-slate-800 px-3 py-1.5 font-medium text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition"
          >
            {isProOrAbove ? "Manage Subscription" : "Upgrade Plan"}
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="mx-4 border-t border-slate-800 py-3 space-y-1">
        <button
          onClick={() => navigate("/")}
          className={`
            flex w-full items-center gap-3 rounded-lg px-4 py-2.5
            text-slate-300 text-sm transition
            hover:bg-slate-800 hover:text-white
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <span>🌐</span>
          {!collapsed && <span>Visit Website</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`
            flex w-full items-center gap-3 rounded-lg px-4 py-2.5
            text-red-400 text-sm transition
            hover:bg-red-500/10
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
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
        flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition
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
      {!collapsed && <span>{title}</span>}
    </NavLink>
  );
}


