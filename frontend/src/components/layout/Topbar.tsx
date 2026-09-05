import { useEffect, useState } from "react";
import { Bell, Search, Menu, Sparkles, ShieldCheck } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import UserMenu from "../user/UserMenu";
import { useAuth } from "../../context/AuthContext";
import { getBillingOverview, type BillingOverview } from "../../services/billingService";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { token, user } = useAuth();
  const [overview, setOverview] = useState<BillingOverview | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const dashboardPath = isAdmin ? "/admin" : "/dashboard";

  const navItems = [
    {
      name: isAdmin ? "Admin Console" : "Dashboard",
      path: dashboardPath,
    },
    {
      name: "Datasets",
      path: "/datasets",
    },
    {
      name: "Integrations",
      path: "/integrations",
    },
    {
      name: "AI Insights",
      path: "/ai-insights",
    },
    {
      name: "AI Chat",
      path: "/chat",
    },
    {
      name: "Reports",
      path: "/reports",
    },
    {
      name: "Billing",
      path: "/billing",
    },
  ];

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    getBillingOverview()
      .then((data) => {
        if (isMounted) setOverview(data);
      })
      .catch((err) => {
        console.error("Failed to fetch topbar plan overview:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const planName = overview?.plan?.name ?? "Free";
  const isProOrAbove = overview?.hasActiveSubscription;

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950 px-8">
      {/* Brand + Navigation */}
      <div className="flex items-center gap-6">
        {/* Sidebar Toggle */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <Menu size={24} />
        </button>

        <Link to={dashboardPath} className="text-xl font-bold text-cyan-400 hover:opacity-90 transition">
          DIRALIS
        </Link>

        <nav className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm transition-all duration-300 ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-400 shadow-sm font-medium"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Role / Tier Indicator Pill */}
        {isAdmin ? (
          <Link
            to="/admin"
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-500/25 transition"
          >
            <ShieldCheck size={13} className="text-purple-400" />
            <span>Administrator</span>
          </Link>
        ) : (
          <Link
            to="/billing"
            className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
              isProOrAbove
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Sparkles size={12} className={isProOrAbove ? "text-cyan-400" : "text-slate-400"} />
            <span>{planName}</span>
            {!isProOrAbove && <span className="text-[10px] text-cyan-400 underline ml-0.5">Upgrade</span>}
          </Link>
        )}

        {/* Search */}
        <div className="hidden md:flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300">
          <Search size={16} className="text-slate-500" />
          <input
            placeholder="Search..."
            className="w-36 bg-transparent outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Notifications */}
        <button
          className="rounded-full p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <Bell size={20} />
        </button>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}


