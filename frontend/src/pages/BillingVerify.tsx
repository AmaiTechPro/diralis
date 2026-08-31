import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";
import { verifyPayment } from "../services/billingService";

type VerificationState = "VERIFYING" | "SUCCESS" | "FAILED";

export default function BillingVerify() {
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<VerificationState>("VERIFYING");
  const [message, setMessage] = useState("Verifying your payment transaction...");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Paystack and gateways may return reference as `reference` or `trxref`
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      setState("FAILED");
      setMessage("No transaction reference was provided in the callback URL.");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        await verifyPayment(reference!);

        if (cancelled) return;

        setState("SUCCESS");
        setMessage("Your payment was confirmed and your plan entitlements have been activated!");
      } catch (error: any) {
        if (cancelled) return;

        console.error("Payment verification error:", error);
        setState("FAILED");
        setMessage(
          error?.response?.data?.message ||
            "We were unable to verify this transaction. If you were debited, your subscription will activate shortly via webhook."
        );
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (state !== "SUCCESS") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/billing";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state]);

  if (state === "VERIFYING") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-cyan-600" />
          <h1 className="text-2xl font-bold text-slate-900">
            Verifying payment...
          </h1>
          <p className="mt-2 text-slate-500">
            Please wait while we confirm your transaction with the payment gateway.
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
            Payment Confirmed!
          </h1>
          <p className="mt-3 text-slate-600">{message}</p>
          <p className="mt-2 text-xs text-slate-400">
            Redirecting to your billing overview in {countdown}s...
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/billing"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
            >
              Go to Billing <ArrowRight size={16} />
            </Link>
            <Link
              to="/dashboard"
              className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <XCircle className="mx-auto mb-4 h-16 w-16 text-rose-600" />
        <h1 className="text-3xl font-bold text-slate-900">
          Verification Failed
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


