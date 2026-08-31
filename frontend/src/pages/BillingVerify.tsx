import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { verifyPayment } from "../services/billingService";

type VerificationState = "VERIFYING" | "SUCCESS" | "FAILED";

export default function BillingVerify() {
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<VerificationState>("VERIFYING");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const reference = searchParams.get("reference");

    if (!reference) {
      setState("FAILED");
      setMessage("No payment reference was provided.");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        await verifyPayment(reference!);

        if (cancelled) return;

        setState("SUCCESS");
        setMessage("Your payment was verified and your plan is now active!");
      } catch (error: any) {
        if (cancelled) return;

        console.error("Payment verification failed:", error);
        setState("FAILED");
        setMessage(
          error?.response?.data?.message ||
            "We could not verify your payment transaction."
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
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-cyan-600" />
          <h1 className="text-2xl font-bold text-slate-900">
            Verifying payment
          </h1>
          <p className="mt-2 text-slate-500">
            Please wait while we confirm your transaction with the provider.
          </p>
        </div>
      </div>
    );
  }

  if (state === "SUCCESS") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-600" />
          <h1 className="text-3xl font-bold text-slate-900">
            Payment successful
          </h1>
          <p className="mt-3 text-slate-600">{message}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/billing"
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
            >
              View Subscription
            </Link>
            <Link
              to="/dashboard"
              className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <XCircle className="mx-auto mb-4 h-16 w-16 text-red-600" />
        <h1 className="text-3xl font-bold text-slate-900">
          Verification failed
        </h1>
        <p className="mt-3 text-slate-600">{message}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/pricing"
            className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
          >
            Return to Pricing
          </Link>
          <Link
            to="/billing"
            className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            Billing Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

