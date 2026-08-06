import { useState } from "react";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";


const API = import.meta.env.VITE_API_URL;

export default function VerifyEmail() {

  const navigate = useNavigate();

  const location = useLocation();



const [email] = useState(
  location.state?.email ?? ""
);

const [success, setSuccess] =
  useState("");

if (!email) {
  navigate("/register", {
    replace: true,
  });

  return null;
}



  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setLoading(true);

    setError("");

    try {

      const response =
        await fetch(
          `${API}/auth/verify-email`,
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              email,

              code,

            }),

          }
        );

      const data =
  await response.json();

if (!response.ok) {
  throw new Error(
    data.error
  );
}

setSuccess(
  "Email verified successfully! Redirecting to login..."
);

setTimeout(() => {
  navigate("/login", {
    replace: true,
  });
}, 2000);

    } catch (error) {

      setError(
        (error as Error).message
      );
      {success && (
  <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-green-400">
    {success}
  </div>
)}

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

      <h1 className="mb-3 text-center text-3xl font-bold">

        Verify Your Email

      </h1>

      <p className="mb-6 text-center text-slate-400">

        We've sent a 6-digit verification code to

        <br />

        <span className="font-semibold text-cyan-400">

          {email}

        </span>

      </p>

      {error && (

        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-400">

          {error}

        </div>

      )}

      <input

        type="text"

        inputMode="numeric"

        maxLength={6}

        placeholder="Enter 6-digit code"

        value={code}

        onChange={(e) =>
          setCode(
            e.target.value.replace(/\D/g, "")
          )
        }

        className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-center text-3xl tracking-[10px] outline-none transition focus:border-cyan-500"

      />

      <button

        disabled={
          loading ||
          code.length !== 6
        }

        className="w-full rounded-xl bg-cyan-500 p-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"

      >

        {loading
          ? "Verifying..."
          : "Verify Email"}

      </button>

      <p className="mt-6 text-center text-sm text-slate-500">

        Didn't receive the code?

        <span className="cursor-not-allowed font-medium text-slate-400">

          {" "}Resend Code (Coming Soon)

        </span>

      </p>

    </form>

  </div>

);

}


