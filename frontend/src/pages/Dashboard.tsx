import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 p-12 text-white">
      <h1 className="text-5xl font-bold">
        Welcome,
      </h1>

      <p className="mt-4 text-2xl text-cyan-400">
        {user?.fullName}
      </p>

      <div className="mt-10 rounded-xl bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">
          Your Dashboard
        </h2>

        <p className="mt-4 text-slate-400">
          🎉 Authentication is working successfully.
        </p>
      </div>
    </div>
  );
}


