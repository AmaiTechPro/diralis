import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { verifyPayment } from "../services/billingService";

type VerificationState =
  | "VERIFYING"
  | "SUCCESS"
  | "FAILED";

export default function BillingVerify() {
  const [searchParams] = useSearchParams();

  const [state, setState] =
    useState<VerificationState>("VERIFYING");

  const [message, setMessage] =
    useState("Verifying your payment...");

  useEffect(() => {
    const reference =
  searchParams.get("reference");

if (!reference) {
  setState("FAILED");
  setMessage(
    "No payment reference was provided."
  );
  return;
}

const paymentReference = reference;

    let cancelled = false;

    async function verify() {
      try {
        await verifyPayment(paymentReference);

        if (cancelled) {
          return;
        }

        setState("SUCCESS");
        setMessage(
          "Your payment was verified successfully."
        );
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        console.error(
          "Payment verification failed:",
          error
        );

        setState("FAILED");

        setMessage(
          error?.response?.data?.message ||
            "We could not verify your payment."
        );
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (state === "VERIFYING") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2
            className="mx-auto mb-4 h-12 w-12 animate-spin"
          />

          <h1 className="text-2xl font-semibold">
            Verifying payment
          </h1>

          <p className="mt-2 text-gray-500">
            Please wait while we confirm your
            transaction.
          </p>
        </div>
      </div>
    );
  }

  if (state === "SUCCESS") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <CheckCircle2
            className="mx-auto mb-4 h-16 w-16"
          />

          <h1 className="text-3xl font-bold">
            Payment successful
          </h1>

          <p className="mt-3 text-gray-500">
            {message}
          </p>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-lg px-5 py-3 font-medium bg-black text-white"
            >
              Go to Dashboard
            </Link>

            <Link
              to="/pricing"
              className="rounded-lg px-5 py-3 font-medium border"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <XCircle
          className="mx-auto mb-4 h-16 w-16"
        />

        <h1 className="text-3xl font-bold">
          Payment verification failed
        </h1>

        <p className="mt-3 text-gray-500">
          {message}
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/pricing"
            className="rounded-lg px-5 py-3 font-medium bg-black text-white"
          >
            Return to Pricing
          </Link>

          <Link
            to="/dashboard"
            className="rounded-lg px-5 py-3 font-medium border"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

