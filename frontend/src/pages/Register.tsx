import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Fingerprint,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Mail,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Copy,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import { register as registerApi, verifyEmail as verifyEmailApi, resendVerificationCode } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { registerPasskey } from "../services/passkeyService";
import { apiFetch } from "../api/client";

function validatePassword(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

type OnboardingStep = "REGISTER" | "VERIFY_EMAIL" | "OPTIONAL_SECURITY";

export default function Register() {
  const navigate = useNavigate();
  const { login, user: authUser } = useAuth();

  const [step, setStep] = useState<OnboardingStep>("REGISTER");

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email Verification State
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Authenticated User Session
  const [authenticatedUser, setAuthenticatedUser] = useState<any | null>(null);

  // Security Choices State ("passkey" | "totp" | null)
  const [securityMethod, setSecurityMethod] = useState<"passkey" | "totp" | null>(null);

  // Passkey Setup State
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySuccess, setPasskeySuccess] = useState(false);

  // TOTP / QR Code State
  const [totpLoading, setTotpLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpSuccess, setTotpSuccess] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

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

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // STEP 1: Handle initial user registration
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("Please choose a stronger password matching the requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerApi({
        fullName,
        username,
        email,
        password,
      });

      setStep("VERIFY_EMAIL");
      setResendCooldown(60);
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

  // STEP 2: Handle mandatory email verification code
  async function handleVerifyEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (otpCode.trim().length !== 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const res: any = await verifyEmailApi(email, otpCode.trim());

      if (res.token && res.user) {
        login(res.user, res.token);
        setAuthenticatedUser(res.user);
        setStep("OPTIONAL_SECURITY");
      } else {
        navigate("/login");
      }
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

  async function handleResendCode() {
    if (resendCooldown > 0) return;
    setError("");
    setResendLoading(true);

    try {
      await resendVerificationCode(email);
      setResendCooldown(60);
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

  // STEP 3A: Optional Passkey Registration
  async function handleRegisterPasskey() {
    setError("");
    setPasskeyLoading(true);

    try {
      const deviceName = `${navigator.platform || "Primary"} Security Key`;
      await registerPasskey(deviceName);
      setPasskeySuccess(true);
      setTimeout(() => {
        proceedToApp();
      }, 1500);
    } catch (err: any) {
      setError(
        err.message ||
        err.response?.data?.message ||
        "Passkey setup was cancelled or failed. You can try again or use an authenticator app."
      );
    } finally {
      setPasskeyLoading(false);
    }
  }

  // STEP 3B: Optional Authenticator (TOTP / QR Code)
  async function handleStartTotpSetup() {
    setError("");
    setSecurityMethod("totp");
    setTotpLoading(true);

    try {
      const res = await apiFetch<{ qrCode: string; secret: string }>("/auth/2fa/setup", {
        method: "POST",
      });
      setQrCodeData(res);
    } catch (err: any) {
      setError(err.message || "Failed to generate Authenticator QR Code.");
    } finally {
      setTotpLoading(false);
    }
  }

  async function handleVerifyTotp() {
    if (totpCode.trim().length !== 6) {
      setError("Please enter the 6-digit code from your authenticator app.");
      return;
    }

    setTotpLoading(true);
    setError("");

    try {
      await apiFetch("/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ code: totpCode.trim() }),
      });
      setTotpSuccess(true);
      setTimeout(() => {
        proceedToApp();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid verification code. Please check your authenticator app.");
    } finally {
      setTotpLoading(false);
    }
  }

  function proceedToApp() {
    const targetUser = authenticatedUser || authUser;
    if (targetUser?.role === "ADMIN") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      {/* STEP 1: INITIAL SIGN UP FORM */}
      {step === "REGISTER" && (
        <form
          onSubmit={handleRegisterSubmit}
          className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
        >
          <h1 className="mb-2 text-center text-3xl font-bold text-white">
            Create Account
          </h1>
          <p className="mb-8 text-center text-slate-400">
            Join Diralis today
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-400 text-sm">
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
              {loading ? "Sending Verification Code..." : "Create Account"}
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
      )}

      {/* STEP 2: MANDATORY EMAIL OTP VERIFICATION GATE */}
      {step === "VERIFY_EMAIL" && (
        <form
          onSubmit={handleVerifyEmailSubmit}
          className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            <Mail size={28} />
          </div>

          <h2 className="text-center text-2xl font-bold text-white">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            We sent a 6-digit code to <span className="font-medium text-slate-200">{email}</span>.
            Enter it below to activate your account.
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-center font-mono text-2xl tracking-[0.4em] text-white outline-none transition focus:border-cyan-500"
              required
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full rounded-xl bg-cyan-500 p-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Confirm & Activate"}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setStep("REGISTER")}
                className="hover:text-slate-200 underline"
              >
                Change email
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || resendLoading}
                className="inline-flex items-center gap-1.5 font-medium text-cyan-400 hover:underline disabled:opacity-50"
              >
                <RefreshCw size={12} className={resendLoading ? "animate-spin" : ""} />
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 3: OPTIONAL MULTI-FACTOR / PASSKEY SETUP SCREEN */}
      {step === "OPTIONAL_SECURITY" && (
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            {passkeySuccess || totpSuccess ? (
              <CheckCircle2 size={28} />
            ) : (
              <ShieldCheck size={28} />
            )}
          </div>

          <h2 className="text-center text-2xl font-bold text-white">
            {passkeySuccess || totpSuccess
              ? "Security Method Activated!"
              : "Enhance Account Security (Optional)"}
          </h2>

          <p className="mt-2 text-center text-sm text-slate-400">
            {passkeySuccess || totpSuccess
              ? "Your account is hardened. Redirecting you to your workspace..."
              : "Choose an extra layer of protection for future logins, or skip straight to your dashboard."}
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW: METHOD SELECTION */}
          {!securityMethod && !passkeySuccess && !totpSuccess && (
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setSecurityMethod("passkey");
                  handleRegisterPasskey();
                }}
                disabled={passkeyLoading}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/80 p-4 text-left transition hover:border-cyan-500/50 hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                    <Fingerprint size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Enable Passkey</div>
                    <div className="text-xs text-slate-400">
                      Touch ID, Windows Hello, or USB Key
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-500" />
              </button>

              <button
                type="button"
                onClick={handleStartTotpSetup}
                disabled={totpLoading}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/80 p-4 text-left transition hover:border-cyan-500/50 hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Authenticator App</div>
                    <div className="text-xs text-slate-400">
                      Google Authenticator, Authy, or 1Password
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-500" />
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={proceedToApp}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  <span>Skip for now, take me to Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PASSKEY IN-PROGRESS */}
          {securityMethod === "passkey" && !passkeySuccess && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">
                <Fingerprint size={36} className="mx-auto text-cyan-400 animate-pulse" />
                <div className="mt-3 text-sm font-semibold text-white">Follow browser prompt</div>
                <p className="mt-1 text-xs text-slate-400">
                  Touch your fingerprint sensor, scan your face, or insert your security key.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  disabled={passkeyLoading}
                  className="flex-1 rounded-xl bg-cyan-500 p-3 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  {passkeyLoading ? "Prompting..." : "Retry Prompt"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSecurityMethod(null);
                    setError("");
                  }}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* VIEW: TOTP QR CODE SETUP */}
          {securityMethod === "totp" && !totpSuccess && (
            <div className="mt-6 space-y-4">
              {totpLoading && !qrCodeData ? (
                <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                  Generating QR Code...
                </div>
              ) : qrCodeData ? (
                <>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <img
                      src={qrCodeData.qrCode}
                      alt="Authenticator QR Code"
                      className="mx-auto h-44 w-44 rounded-lg bg-white p-2"
                    />
                    <p className="mt-3 text-xs text-slate-400">
                      Scan this QR code with Google Authenticator or Microsoft Authenticator
                    </p>

                    <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-900 p-2 text-xs font-mono text-slate-300">
                      <span className="truncate pr-2">{qrCodeData.secret}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(qrCodeData.secret);
                          setCopiedSecret(true);
                          setTimeout(() => setCopiedSecret(false), 2000);
                        }}
                        className="flex items-center gap-1 text-cyan-400 hover:underline shrink-0"
                      >
                        <Copy size={12} />
                        {copiedSecret ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300">
                      Enter 6-digit Code from Authenticator
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-center font-mono text-xl tracking-[0.3em] text-white outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleVerifyTotp}
                      disabled={totpLoading || totpCode.length !== 6}
                      className="flex-1 rounded-xl bg-emerald-500 p-3 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {totpLoading ? "Verifying..." : "Activate Authenticator"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSecurityMethod(null);
                        setError("");
                      }}
                      className="rounded-xl border border-slate-700 px-4 py-3 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Back
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* CONTINUE BUTTON UPON ACTIVATION */}
          {(passkeySuccess || totpSuccess) && (
            <div className="mt-6">
              <button
                type="button"
                onClick={proceedToApp}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 p-3.5 font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


