import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import api from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError("Invalid reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post(
        "/auth/reset-password",
        {
          token,
          password,
        }
      );

      setMessage(
        "Password reset successfully. Redirecting..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch {
      setError(
        "Password reset failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8"
      >
        <h1 className="mb-2 text-center text-3xl font-bold">
          Reset Password
        </h1>

        <p className="mb-8 text-center text-slate-400">
          Enter your new password.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-green-400">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3"
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 p-3 font-semibold text-slate-950"
          >
            {loading
              ? "Updating..."
              : "Reset Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

