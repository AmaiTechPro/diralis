import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, KeyRound, ArrowLeft, Fingerprint } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import { login as loginApi } from "../api/auth";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { authenticateWithPasskey } from "../services/passkeyService";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 2FA Challenge state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isBackupMode, setIsBackupMode] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginApi({
        identifier,
        password,
      });

      // Intercept 2FA challenge gate
      if (result.requires2FA && result.tempToken) {
        setTempToken(result.tempToken);
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      completeLogin(result);
    } catch (err: any) {
      setError(
        err.response?.data?.error ??
        err.response?.data?.message ??
        "Invalid username/email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!twoFactorCode.trim()) {
      setError("Please enter your verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login/2fa", {
        tempToken,
        code: twoFactorCode.trim(),
      });

      completeLogin(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ??
        err.response?.data?.message ??
        "Invalid or expired verification code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePasskeyLogin() {
    setError("");
    setPasskeyLoading(true);

    try {
      const result = await authenticateWithPasskey(tempToken);
      completeLogin(result);
    } catch (err: any) {
      setError(
        err.message ||
        err.response?.data?.message ||
        "Passkey authentication was cancelled or failed."
      );
    } finally {
      setPasskeyLoading(false);
    }
  }

  function completeLogin(result: any) {
    if (result.user && result.token) {
      login(result.user, result.token);

      if (result.user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }

  function resetToCredentials() {
    setRequires2FA(false);
    setTempToken("");
    setTwoFactorCode("");
    setError("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      {!requires2FA ? (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
        >
          <h1 className="mb-2 text-center text-3xl font-bold">Welcome Back</h1>
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
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 pr-12 outline-none transition focus:border-cyan-500"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-cyan-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 p-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Login"}
            </button>

            <div className="my-4 flex items-center">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="px-3 text-sm text-slate-500">OR</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>

            <div className="flex justify-center">
              <GoogleLoginButton />
            </div>
          </div>

          <div className="mt-8 flex justify-between text-sm text-slate-400">
            <Link to="/forgot-password" className="hover:text-cyan-400">
              Forgot Password?
            </Link>

            <Link to="/register" className="hover:text-cyan-400">
              Create Account
            </Link>
          </div>
        </form>
      ) : (
        /* 2FA Challenge Verification Screen */
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            {isBackupMode ? <KeyRound size={28} /> : <ShieldCheck size={28} />}
          </div>

          <h2 className="text-center text-2xl font-bold text-white">
            {isBackupMode ? "Enter Backup Code" : "Two-Factor Verification"}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            {isBackupMode
              ? "Use one of your 8-character recovery backup codes."
              : "Verify your identity using a registered passkey or authenticator code."}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Biometric / Passkey Primary Option */}
          {!isBackupMode && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-60"
              >
                <Fingerprint size={20} />
                {passkeyLoading ? "Prompting Device..." : "Use Passkey or Security Key"}
              </button>

              <div className="my-5 flex items-center">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="px-3 text-xs text-slate-500">OR ENTER CODE</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>
            </div>
          )}

          {/* Form for TOTP / Backup Code */}
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <input
              type="text"
              autoFocus
              maxLength={isBackupMode ? 10 : 6}
              value={twoFactorCode}
              onChange={(e) => {
                const val = isBackupMode
                  ? e.target.value.toUpperCase()
                  : e.target.value.replace(/\D/g, "");
                setTwoFactorCode(val);
              }}
              placeholder={isBackupMode ? "e.g. C3B9E50F" : "000000"}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-center font-mono text-xl tracking-widest text-white outline-none transition focus:border-cyan-500"
            />

            <button
              disabled={loading || passkeyLoading || !twoFactorCode.trim()}
              className="w-full rounded-xl bg-cyan-500 p-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Authenticate"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsBackupMode(!isBackupMode);
                setTwoFactorCode("");
                setError("");
              }}
              className="w-full text-center text-xs text-cyan-400 hover:underline"
            >
              {isBackupMode
                ? "Switch to Authenticator Code (TOTP)"
                : "Lost access? Use an emergency backup code"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={resetToCredentials}
              className="inline-flex w-full items-center justify-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

