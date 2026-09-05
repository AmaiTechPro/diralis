import { useState, useEffect } from "react";
import { Eye, EyeOff, ShieldCheck, KeyRound, ArrowLeft, Fingerprint, RefreshCw } from "lucide-react";
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
  const [availableMethods, setAvailableMethods] = useState<{ totp: boolean; passkey: boolean }>({
    totp: false,
    passkey: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // Inline Email Verification Recovery State
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState("");

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifySuccessMsg("");
    setLoading(true);

    try {
      const result: any = await loginApi({
        identifier,
        password,
      });

      // Intercept 2FA challenge gate
      if (result.requires2FA && result.tempToken) {
        setTempToken(result.tempToken);
        setAvailableMethods({
          totp: Boolean(result.methods?.totp),
          passkey: Boolean(result.methods?.passkey),
        });
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      completeLogin(result);
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ??
        err.response?.data?.message ??
        "Invalid username/email or password.";
      setError(errMsg);

      // Trigger inline OTP verification UI when unverified email is detected
      if (errMsg.toLowerCase().includes("verify your email")) {
        setUnverifiedEmail(identifier.trim());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmailInline() {
    if (verifyCode.trim().length !== 6 || !unverifiedEmail) return;
    setError("");
    setVerifying(true);

    try {
      const res = await api.post("/auth/verify-email", {
        email: unverifiedEmail,
        code: verifyCode.trim(),
      });

      if (res.data?.token && res.data?.user) {
        completeLogin(res.data);
      } else {
        setVerifySuccessMsg("Email verified successfully! You can now log in.");
        setUnverifiedEmail(null);
        setVerifyCode("");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ??
        err.response?.data?.message ??
        "Invalid or expired verification code."
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendInlineCode() {
    if (resendCooldown > 0 || !unverifiedEmail) return;
    setError("");
    setResendLoading(true);

    try {
      await api.post("/auth/resend-verification", {
        email: unverifiedEmail,
      });
      setResendCooldown(60);
      setVerifySuccessMsg("A new 6-digit verification code has been dispatched to your email.");
    } catch (err: any) {
      setError(
        err.response?.data?.error ??
        err.response?.data?.message ??
        "Failed to resend verification code."
      );
    } finally {
      setResendLoading(false);
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
      const response = await api.post("/auth/verify-2fa", {
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
    setIsBackupMode(false);
    setError("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      {!requires2FA ? (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
        >
          <h1 className="mb-2 text-center text-3xl font-bold text-white">Welcome Back</h1>
          <p className="mb-8 text-center text-slate-400">
            Sign in to your Diralis account
          </p>

          {verifySuccessMsg && (
            <div className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400">
              {verifySuccessMsg}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              <p>{error}</p>

              {/* Inline OTP Verification Flow for Unverified Users */}
              {unverifiedEmail && (
                <div className="mt-3 border-t border-red-500/20 pt-3">
                  <p className="text-xs text-slate-300 mb-2">
                    Enter the 6-digit code sent to <span className="font-semibold text-white">{unverifiedEmail}</span>:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                      className="w-32 rounded-lg border border-slate-700 bg-slate-800 p-2 text-center font-mono text-sm tracking-widest text-white outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      disabled={verifying || verifyCode.length !== 6}
                      onClick={handleVerifyEmailInline}
                      className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                    >
                      {verifying ? "Verifying..." : "Verify & Sign In"}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => setUnverifiedEmail(null)}
                      className="hover:underline"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={handleResendInlineCode}
                      disabled={resendCooldown > 0 || resendLoading}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:underline disabled:opacity-50"
                    >
                      <RefreshCw size={11} className={resendLoading ? "animate-spin" : ""} />
                      {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-5">
            <input
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (unverifiedEmail) setUnverifiedEmail(null);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none transition focus:border-cyan-500 text-white"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 pr-12 outline-none transition focus:border-cyan-500 text-white"
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
              : availableMethods.passkey && !availableMethods.totp
              ? "Verify your identity using your registered passkey or security key."
              : !availableMethods.passkey && availableMethods.totp
              ? "Enter the 6-digit code from your authenticator app."
              : "Verify your identity using a registered passkey or authenticator code."}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Biometric / Passkey Option */}
          {!isBackupMode && availableMethods.passkey && (
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

              {/* Show divider only when TOTP form is also present */}
              {availableMethods.totp && (
                <div className="my-5 flex items-center">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="px-3 text-xs text-slate-500">OR ENTER CODE</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
              )}
            </div>
          )}

          {/* Form for TOTP or Backup Code */}
          {(availableMethods.totp || isBackupMode) && (
            <form onSubmit={handleVerify2FA} className={`space-y-4 ${!availableMethods.passkey || isBackupMode ? "mt-6" : ""}`}>
              <input
                type="text"
                autoFocus={!availableMethods.passkey || isBackupMode}
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
            </form>
          )}

          {/* Emergency Backup Mode Toggle */}
          <div className="mt-4">
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
                ? availableMethods.totp
                  ? "Switch to Authenticator Code (TOTP)"
                  : "Switch to Passkey Verification"
                : "Lost access? Use an emergency backup code"}
            </button>
          </div>

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


