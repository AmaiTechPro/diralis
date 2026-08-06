import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import { register as registerApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";


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
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules =
  validatePassword(password);

const passwordValid =
  Object.values(passwordRules).every(Boolean);

const strength =
  Object.values(passwordRules).filter(Boolean).length;

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

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    if (!passwordValid) {

  setError(
    "Please choose a stronger password."
  );

  return;

}

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerApi({
        fullName,
        username,
        email,
        password,
      });

      login(result.user, result.token);

      navigate("/dashboard", {
        replace: true,
         });
    } catch (error: any) {
    setError(
    error.response?.data?.error ??
    error.response?.data?.message ??
    "Registration failed."
    );

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
            onChange={(e) =>
              setFullName(e.target.value)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none transition focus:border-cyan-500"
          />

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none transition focus:border-cyan-500"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none transition focus:border-cyan-500"
          />

          <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 pr-12 outline-none transition focus:border-cyan-500"
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-cyan-400"
  >
    {showPassword ? (
      <EyeOff size={20} />
    ) : (
      <Eye size={20} />
    )}
  </button>
</div>

{/* Password stenght */}

<div className="mt-2">

  <div className="mb-1 flex justify-between text-sm">

    <span className="text-slate-400">
      Password Strength
    </span>

    <span
      className={
        strength >= 4
          ? "text-green-400"
          : "text-slate-400"
      }
    >
      {strengthText}
    </span>

  </div>

  <div className="h-2 overflow-hidden rounded-full bg-slate-700">

    <div
      className={`h-full transition-all duration-300 ${strengthColor}`}
      style={{
        width: `${(strength / 5) * 100}%`,
      }}
    />

  </div>

</div>


{/* Password Live Check */}

<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-sm">

  <p className="mb-2 font-semibold text-slate-300">
    Password Requirements
  </p>

  <ul className="space-y-1">

    <li className={
      passwordRules.length
        ? "text-green-400"
        : "text-slate-500"
    }>
      ✓ At least 8 characters
    </li>

    <li className={
      passwordRules.uppercase
        ? "text-green-400"
        : "text-slate-500"
    }>
      ✓ One uppercase letter
    </li>

    <li className={
      passwordRules.lowercase
        ? "text-green-400"
        : "text-slate-500"
    }>
      ✓ One lowercase letter
    </li>

    <li className={
      passwordRules.number
        ? "text-green-400"
        : "text-slate-500"
    }>
      ✓ One number
    </li>

    <li className={
      passwordRules.special
        ? "text-green-400"
        : "text-slate-500"
    }>
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
    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 pr-12 outline-none transition focus:border-cyan-500"
  />

  <button
    type="button"
    onClick={() =>
      setShowConfirmPassword(!showConfirmPassword)
    }
    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-cyan-400"
  >
    {showConfirmPassword ? (
      <EyeOff size={20} />
    ) : (
      <Eye size={20} />
    )}
  </button>
</div>

          <button
            disabled={loading || !passwordValid}
            className="w-full rounded-xl bg-cyan-500 p-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

          <div className="my-4 flex items-center">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="px-3 text-sm text-slate-500">
            OR
          </span>
         <div className="h-px flex-1 bg-slate-700" />
           </div>

        <div className="flex justify-center">
            <GoogleLoginButton />
            </div>

        </div>

        <div className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-cyan-400 hover:underline"
          >
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}


