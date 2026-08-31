import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Lock, ArrowRight, X } from "lucide-react";
import { useEntitlement } from "../../hooks/useEntitlement";
import type { PlanFeatures } from "../../services/billingService";

interface FeatureGateProps {
  feature?: keyof PlanFeatures | string;
  resourceLimit?: string;
  children: React.ReactNode;
  fallbackMode?: "hide" | "disable" | "blur" | "banner";
  upgradeMessage?: string;
}

export default function FeatureGate({
  feature,
  resourceLimit,
  children,
  fallbackMode = "banner",
  upgradeMessage,
}: FeatureGateProps) {
  const { hasFeature, isUsageExceeded, loading, overview } = useEntitlement();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (loading) {
    return <>{children}</>;
  }

  const featureAllowed = feature ? hasFeature(feature) : true;
  const limitExceeded = resourceLimit ? isUsageExceeded(resourceLimit) : false;
  const isAllowed = featureAllowed && !limitExceeded;

  if (isAllowed) {
    return <>{children}</>;
  }

  const defaultMessage = !featureAllowed
    ? `This feature requires a subscription upgrade.`
    : `You have reached your resource limit for ${resourceLimit}.`;

  const finalMessage = upgradeMessage || defaultMessage;
  const currentPlan = overview?.plan?.name || "Free";

  if (fallbackMode === "hide") {
    return null;
  }

  if (fallbackMode === "disable") {
    return (
      <div
        className="relative cursor-not-allowed opacity-60"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowUpgradeModal(true);
        }}
      >
        <div className="pointer-events-none">{children}</div>
      </div>
    );
  }

  if (fallbackMode === "blur") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/20 p-6 text-center backdrop-blur-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-cyan-400 shadow-md">
            <Lock size={22} />
          </div>
          <h4 className="mt-3 text-base font-bold text-slate-900">
            Feature Locked
          </h4>
          <p className="mt-1 max-w-sm text-xs text-slate-600">
            {finalMessage}
          </p>
          <Link
            to="/billing"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition shadow-sm"
          >
            <Sparkles size={13} /> Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-cyan-500/10 to-transparent p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Upgrade Available
                </h4>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Current: {currentPlan}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">{finalMessage}</p>
            </div>
          </div>

          <Link
            to="/billing"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shrink-0 shadow-sm"
          >
            Upgrade Plan <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-cyan-600" size={18} />
                <h3 className="font-bold text-slate-900">Unlock Feature</h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-600">{finalMessage}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <Link
                to="/billing"
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
              >
                View Plans <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


