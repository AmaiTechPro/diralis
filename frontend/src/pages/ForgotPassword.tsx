import { useState } from "react";
import { Link } from "react-router-dom";

import {
  forgotPassword,
} from "../api/auth";

export default function ForgotPassword() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response =
    await forgotPassword({
     email,
     });

   setMessage(
    response.message
   );
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          "Something went wrong."
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
        <h1 className="mb-2 text-3xl font-bold text-center">
          Forgot Password
        </h1>

        <p className="mb-6 text-center text-slate-400">
          Enter your email to receive a reset link.
        </p>

        {message && (
          <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-green-400">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-400">
            {error}
          </div>
        )}

        <input
          type="email"
          required
          placeholder="Email Address"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="mb-5 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
        />

        <button
          disabled={loading}
          className="w-full rounded-xl bg-cyan-500 p-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading
            ? "Sending..."
            : "Send Reset Link"}
        </button>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-cyan-400 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}

