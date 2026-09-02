import { useAuth } from "../context/AuthContext";
import { getGreeting } from "../utils/getGreeting";
import { motion } from "framer-motion";
import { useDashboard } from "../hooks/useDashboard";
import { Layers } from "lucide-react";

     {/* FRESHNESS BANNERS IMPORT */}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listIntegrationsFreshness, type ConnectionFreshness } from "../services/integrationService";
import { FreshnessBadge } from "../components/integrations/FreshnessBadge";


export default function Dashboard() {
  const { user } = useAuth();
  const { text, emoji } = getGreeting();

  const { dashboardData, loading, error } = useDashboard();

  const [connections, setConnections] = useState<ConnectionFreshness[]>([]);

  useEffect(() => {
    let isMounted = true;
    listIntegrationsFreshness()
      .then((conns) => {
        if (isMounted) setConnections(conns);
      })
      .catch(() => {
        // Silently ignore if unentitled or unavailable on dashboard
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeConnection = connections.find((c) => c.status === "ACTIVE") || connections[0];


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
      {error}
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

        {activeConnection && (
        <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">
                  {activeConnection.name}
                </span>
                <FreshnessBadge freshness={activeConnection.freshness} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeConnection.lastSuccessfulSyncAt
                  ? `Last synchronized: ${new Date(activeConnection.lastSuccessfulSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${activeConnection.recordsLastSynced} records)`
                  : "Never synchronized"}
              </p>
            </div>
          </div>
          <Link
            to="/integrations"
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 self-start sm:self-auto hover:underline"
          >
            Manage Data Sources &rarr;
          </Link>
        </div>
      )}

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

