import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../context/AuthContext";
import { getGreeting } from "../utils/getGreeting";
import { motion } from "framer-motion";


export default function Dashboard() {
  const { user } = useAuth();
  const { text, emoji } = getGreeting();

  return (
    <AppLayout>
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
            value="0"
          />

          <StatCard
            title="AI Reports"
            value="0"
          />

          <StatCard
            title="Dashboards"
            value="0"
          />

          <StatCard
            title="Account"
            value="Active"
          />

        </div>

        <div className="mt-10 rounded-xl bg-slate-900 p-8">

          <h2 className="text-2xl font-bold">
            Welcome to Diralis 🚀
          </h2>

          <p className="mt-4 text-slate-400">
            Your workspace is ready.

            The next step is uploading your first dataset
            so Diralis can generate AI-powered insights,
            dashboards and reports.
          </p>

        </div>

      </div>
    </AppLayout>
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


