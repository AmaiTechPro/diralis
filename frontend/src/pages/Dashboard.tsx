import { useAuth } from "../context/AuthContext";
import { getGreeting } from "../utils/getGreeting";
import { motion } from "framer-motion";
import { useDashboard } from "../hooks/useDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { text, emoji } = getGreeting();

  const { dashboardData, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="p-8 text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 text-red-400">
        Failed to load dashboard.
      </div>
    );
  }

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-5xl font-bold"
      >
        {emoji} {text},{" "}
        <span className="text-cyan-400">
          {user?.fullName}
        </span>
      </motion.h1>

      <p className="mt-3 text-slate-400">
        Here's what's happening in your workspace today.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Datasets"
          value={dashboardData.stats.datasets.toString()}
        />

        <StatCard
          title="AI Reports"
          value={dashboardData.stats.reports.toString()}
        />

        <StatCard
          title="Dashboards"
          value={dashboardData.stats.dashboards.toString()}
        />

        <StatCard
          title="Account"
          value={dashboardData.stats.account}
        />
      </div>

      <div className="mt-10 rounded-xl bg-slate-900 p-8">
        <h2 className="text-2xl font-bold">
          {dashboardData.recommendation.title}
        </h2>

        <p className="mt-4 text-slate-400">
          {dashboardData.recommendation.description}
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
}

function StatCard({
  title,
  value,
}: StatCardProps) {
  return (
    <div className="rounded-xl bg-slate-900 p-6">
      <p className="text-slate-400">
        {title}
      </p>

      <h3 className="mt-3 text-4xl font-bold">
        {value}
      </h3>
    </div>
  );
}

