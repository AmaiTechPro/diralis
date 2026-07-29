import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login as loginApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await loginApi({
        identifier,
        password,
      });

      login(result.user, result.token);

      navigate("/dashboard");
    } catch {
      setError("Invalid username/email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
      >
        <h1 className="mb-2 text-center text-3xl font-bold">
          Welcome Back
        </h1>

        <p className="mb-8 text-center text-slate-400">
          Sign in to your Diralis account
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <input
            type="text"
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none transition focus:border-cyan-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none transition focus:border-cyan-500"
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 p-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Login"}
          </button>

          <button
            type="button"
            className="w-full rounded-xl border border-slate-700 p-3 transition hover:border-slate-500"
          >
            Continue with Google
          </button>
        </div>

        <div className="mt-8 flex justify-between text-sm text-slate-400">
          <button
            type="button"
            className="hover:text-cyan-400"
          >
            Forgot Password?
          </button>

          <Link
            to="/register"
            className="hover:text-cyan-400"
          >
            Create Account
          </Link>
        </div>
      </form>
    </div>
  );
}

