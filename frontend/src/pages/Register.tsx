import { useState } from "react";
import { Eye, EyeOff, Fingerprint, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import { register as registerApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { registerPasskey } from "../services/passkeyService";

function validatePassword(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Post-Signup Onboarding State
  const [registeredUser, setRegisteredUser] = useState<any | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySuccess, setPasskeySuccess] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules = validatePassword(password);
  const passwordValid = Object.values(passwordRules).every(Boolean);
  const strength = Object.values(passwordRules).filter(Boolean).length;

  const strengthText = [
    "Very Weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Excellent",
  ][strength];

  const strengthColor = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
  ][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("Please choose a stronger password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response: any = await registerApi({
        fullName,
        username,
        email,
        password,
      });

      // Save session credentials immediately
      if (response.token && response.user) {
        login(response.user, response.token);
        setRegisteredUser(response.user);
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ??
        err.response?.data?.message ??
        "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterPasskey() {
    setError("");
    setPasskeyLoading(true);

    try {
      const deviceName = `${navigator.platform || "Primary"} Device`;
      await registerPasskey(deviceName);
      setPasskeySuccess(true);
      setTimeout(() => {
        proceedToApp();
      }, 1200);
    } catch (err: any) {
      setError(
        err.message ||
        err.response?.data?.message ||
        "Passkey setup was cancelled or failed."
      );
    } finally {
      setPasskeyLoading(false);
    }
  }

  function proceedToApp() {
    if (registeredUser?.role === "ADMIN") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      {!registeredUser ? (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
        >
          <h1 className="mb-2 text-center text-3xl font-bold text-white">
            Create Account
          </h1>
          <p className="mb-8 text-center text-slate-400">
            Join Diralis today
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none transition focus:border-cyan-500"
              required
            />

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none transition focus:border-cyan-500"
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none transition focus:border-cyan-500"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 pr-12 text-white outline-none transition focus:border-cyan-500"
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

            {/* Password strength */}
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-400">Password Strength</span>
                <span className={strength >= 4 ? "text-green-400" : "text-slate-400"}>
                  {strengthText}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                <div
                  className={`h-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: `${(strength / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Password Requirements */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-sm">
              <p className="mb-2 font-semibold text-slate-300">
                Password Requirements
              </p>
              <ul className="space-y-1">
                <li className={passwordRules.length ? "text-green-400" : "text-slate-500"}>
                  ✓ At least 8 characters
                </li>
                <li className={passwordRules.uppercase ? "text-green-400" : "text-slate-500"}>
                  ✓ One uppercase letter
                </li>
                <li className={passwordRules.lowercase ? "text-green-400" : "text-slate-500"}>
                  ✓ One lowercase letter
                </li>
                <li className={passwordRules.number ? "text-green-400" : "text-slate-500"}>
                  ✓ One number
                </li>
                <li className={passwordRules.special ? "text-green-400" : "text-slate-500"}>
                  ✓ One special character
                </li>
              </ul>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 pr-12 text-white outline-none transition focus:border-cyan-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-cyan-400"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              disabled={loading || !passwordValid}
              className="w-full rounded-xl bg-cyan-500 p-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
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

          <div className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-cyan-400 hover:underline">
              Login
            </Link>
          </div>
        </form>
      ) : (
        /* Optional Passkey Setup Onboarding Screen */
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            {passkeySuccess ? <CheckCircle2 size={28} /> : <Fingerprint size={28} />}
          </div>

          <h2 className="text-center text-2xl font-bold text-white">
            {passkeySuccess ? "Passkey Configured!" : "Secure with Passkey (Optional)"}
          </h2>

          <p className="mt-2 text-center text-sm text-slate-400">
            {passkeySuccess
              ? "Your device has been enrolled. Directing you to your dashboard..."
              : "Enable biometric sign-in (Touch ID, Windows Hello, or Security Key) to log in instantly without typing passwords."}
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {!passkeySuccess && (
              <button
                type="button"
                onClick={handleRegisterPasskey}
                disabled={passkeyLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 p-3.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
              >
                <Fingerprint size={20} />
                {passkeyLoading ? "Prompting Device..." : "Enable Passkey Now"}
              </button>
            )}

            <button
              type="button"
              onClick={proceedToApp}
              disabled={passkeyLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <span>{passkeySuccess ? "Continue to Dashboard" : "Skip for now, take me to Dashboard"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



