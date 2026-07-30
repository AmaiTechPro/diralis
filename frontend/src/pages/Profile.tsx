import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <h1 className="text-4xl font-bold">
        Profile
      </h1>

      <div className="mt-8 rounded-xl bg-slate-900 p-6">

        <p>
          <strong>Name:</strong> {user?.fullName}
        </p>

        <p className="mt-3">
          <strong>Username:</strong> {user?.username}
        </p>

        <p className="mt-3">
          <strong>Email:</strong> {user?.email}
        </p>

        <p className="mt-3">
          <strong>Provider:</strong> {user?.provider}
        </p>

      </div>
    </AppLayout>
  );
}
