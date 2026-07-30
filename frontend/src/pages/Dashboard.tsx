import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-8">

        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-cyan-400 text-sm uppercase tracking-widest">
              DIRALIS
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Welcome back, {user?.fullName}! 👋
            </h1>

            <p className="mt-2 text-slate-400">
              Ready to turn your business data into intelligent insights?
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-500">
              Signed in as
            </p>

            <p className="font-semibold">
              {user?.email}
            </p>

            <span className="mt-2 inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-400">
              {user?.provider === "google"
                ? "Google Account"
                : "Local Account"}
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-4">

          <div className="rounded-xl bg-slate-900 p-6">
            <h3 className="text-slate-400">
              Datasets
            </h3>

            <p className="mt-3 text-4xl font-bold">
              0
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h3 className="text-slate-400">
              AI Reports
            </h3>

            <p className="mt-3 text-4xl font-bold">
              0
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h3 className="text-slate-400">
              Dashboards
            </h3>

            <p className="mt-3 text-4xl font-bold">
              0
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h3 className="text-slate-400">
              Account
            </h3>

            <p className="mt-3 text-xl font-semibold text-green-400">
              Active
            </p>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="mt-10 rounded-xl bg-slate-900 p-8">

          <h2 className="text-2xl font-bold">
            Quick Actions
          </h2>

          <p className="mt-2 text-slate-400">
            Your workspace is ready. Start by uploading your first dataset.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">

            <button className="rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
              Upload Dataset
            </button>

            <button className="rounded-lg border border-slate-700 px-6 py-3 transition hover:border-cyan-500">
              Create Dashboard
            </button>

            <button className="rounded-lg border border-slate-700 px-6 py-3 transition hover:border-cyan-500">
              AI Insights
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}


