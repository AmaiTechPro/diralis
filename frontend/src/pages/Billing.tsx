import { useEffect, useState } from "react";
import {
  CreditCard,
  Check,
  Sparkles,
  Rocket,
  Building2,
  Crown,
  Zap,
  Loader2,
  AlertTriangle,
  History,
  Clock,
  Calendar,
} from "lucide-react";

import {
  getPlans,
  getBillingOverview,
  getBillingHistory,
  createCheckout,
  cancelSubscription,
  type SubscriptionPlan,
  type BillingOverview,
  type BillingPayment,
} from "../services/billingService";

import { useAuth } from "../context/AuthContext";

const planIcons: Record<string, typeof Sparkles> = {
  FREE: Sparkles,
  STARTER: Zap,
  PRO: Rocket,
  BUSINESS: Building2,
  CUSTOM: Crown,
};

function formatPrice(price: number | null, currency: string) {
  if (price === null) {
    return "Custom";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price / 100);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFeatureName(key: string) {
  const names: Record<string, string> = {
    aiChat: "AI Chat",
    aiAgent: "AI Agent",
    reports: "Reports",
    analytics: "Analytics",
    forecasting: "Forecasting",
    advancedAnalytics: "Advanced Analytics",
    integrations: "Integrations",
    prioritySupport: "Priority Support",
    dedicatedSupport: "Dedicated Support",
    customLimits: "Custom Limits",
    customIntegrations: "Custom Integrations",
  };

  return (
    names[key] ??
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}

function formatLimitName(key: string) {
  const names: Record<string, string> = {
    datasets: "Datasets",
    storageMb: "Storage",
    reportsPerMonth: "Reports / month",
    forecastsPerMonth: "Forecasts / month",
    aiRequestsPerMonth: "AI requests / month",
    teamMembers: "Team members",
  };

  return (
    names[key] ??
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}

function formatLimitValue(key: string, value: unknown) {
  if (value === null || value === undefined) {
    return "Unlimited";
  }

  if (typeof value === "number") {
    if (key === "storageMb") {
      if (value >= 1000) {
        return `${value / 1000} GB`;
      }
      return `${value} MB`;
    }
    return value.toLocaleString();
  }

  return String(value);
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default function Billing() {
  const { token } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [history, setHistory] = useState<BillingPayment[]>([]);

  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBillingData() {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [plansRes, overviewRes, historyRes] = await Promise.all([
        getPlans(),
        getBillingOverview(),
        getBillingHistory(),
      ]);

      setPlans(Array.isArray(plansRes) ? plansRes : plansRes?.plans ?? []);
      setOverview(overviewRes);
      setHistory(historyRes?.history ?? []);
    } catch (err) {
      console.error("Failed to load billing:", err);
      setError("Unable to load your billing information. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBillingData();
  }, [token]);

  async function handleUpgrade(plan: SubscriptionPlan) {
    if (!token) return;

    if (plan.code === "CUSTOM") {
      window.location.href = "/contact";
      return;
    }

    if (plan.code === "FREE") return;

    try {
      setCheckoutPlan(plan.id);

      const response = await createCheckout(
        plan.id,
        billing === "monthly" ? "MONTHLY" : "YEARLY"
      );

      const redirectUrl =
        response?.checkoutUrl ||
        response?.authorizationUrl ||
        (typeof response?.url === "string" ? response.url : null);

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      throw new Error("No checkout URL returned from billing provider.");
    } catch (err: any) {
      console.error("Checkout failed:", err);
      const msg =
        err?.response?.data?.message ||
        "Unable to start checkout. Please try again.";
      alert(msg);
    } finally {
      setCheckoutPlan(null);
    }
  }

  async function handleCancelSubscription() {
    if (!token) return;

    try {
      setCancelling(true);
      await cancelSubscription({ immediately: false });
      setShowCancelModal(false);
      await loadBillingData();
    } catch (err: any) {
      console.error("Failed to cancel subscription:", err);
      const msg =
        err?.response?.data?.message ||
        "Failed to cancel subscription. Please try again.";
      alert(msg);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="animate-spin" size={22} />
          Loading billing overview...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        {error}
      </div>
    );
  }

  const activeSubscription = overview?.subscription;
  const currentPlan = overview?.plan;
  const entitlements = overview?.entitlements;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
            <CreditCard className="text-cyan-500" size={23} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
            <p className="mt-1 text-slate-500">
              Manage your subscription, plan entitlements, and invoice history.
            </p>
          </div>
        </div>
      </div>

      {/* Current Subscription Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Current Plan</p>
            <div className="mt-2 flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-900">
                {currentPlan?.name ?? "Free"}
              </h2>

              {activeSubscription ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {formatStatus(activeSubscription.status)}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Default Tier
                </span>
              )}
            </div>

            {activeSubscription && (
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-slate-400" />
                  Period: {formatDate(activeSubscription.currentPeriodStart)} -{" "}
                  {formatDate(activeSubscription.currentPeriodEnd)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} className="text-slate-400" />
                  Billed {activeSubscription.interval.toLowerCase()}
                </span>
              </div>
            )}

            {activeSubscription?.cancelAtPeriodEnd && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <AlertTriangle size={14} className="text-amber-600" />
                Subscription is set to cancel at the end of the current billing
                period on {formatDate(activeSubscription.currentPeriodEnd)}.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            {currentPlan && (
              <div>
                <p className="text-sm text-slate-500 lg:text-right">
                  Plan price
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900 lg:text-right">
                  {formatPrice(
                    activeSubscription?.interval === "MONTHLY"
                      ? currentPlan.monthlyPrice
                      : currentPlan.annualPrice,
                    currentPlan.currency
                  )}
                  {currentPlan.monthlyPrice !== null && (
                    <span className="text-sm font-normal text-slate-500">
                      {" "}
                      / {activeSubscription?.interval?.toLowerCase() ?? "month"}
                    </span>
                  )}
                </p>
              </div>
            )}

            {activeSubscription &&
              !activeSubscription.cancelAtPeriodEnd &&
              activeSubscription.status === "ACTIVE" && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                >
                  Cancel Subscription
                </button>
              )}
          </div>
        </div>

        {/* Entitlements Details */}
        {entitlements && (
          <div className="mt-8 grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Plan Limits
              </p>
              <div className="space-y-2">
                {Object.entries(entitlements.limits ?? {}).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span className="text-slate-500">
                      {formatLimitName(key)}
                    </span>
                    <span className="font-medium text-slate-700">
                      {formatLimitValue(key, value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Included Features
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(entitlements.features ?? {})
                  .filter(([, enabled]) => enabled === true)
                  .map(([feature]) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <Check size={17} className="text-cyan-500" />
                      {formatFeatureName(feature)}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Upgrade Options Section */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Upgrade your plan
            </h2>
            <p className="mt-1 text-slate-500">
              Unlock higher computing capacities and advanced intelligence
              features.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-lg px-5 py-2 text-sm font-medium ${
                billing === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`rounded-lg px-5 py-2 text-sm font-medium ${
                billing === "yearly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans
            .filter((plan) => plan.code !== "FREE")
            .map((plan) => {
              const Icon = planIcons[plan.code] ?? Sparkles;
              const price =
                billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
              const isCurrent = currentPlan?.id === plan.id;
              const popular = plan.code === "PRO";

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
                    popular
                      ? "border-cyan-500 ring-1 ring-cyan-500"
                      : "border-slate-200"
                  }`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-6 rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-white">
                      Recommended
                    </div>
                  )}

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
                    <Icon size={22} className="text-cyan-600" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="mt-2 min-h-[48px] text-sm text-slate-500">
                    {plan.description}
                  </p>

                  <div className="mt-5">
                    <span className="text-2xl font-bold text-slate-900">
                      {formatPrice(price, plan.currency)}
                    </span>
                    {price !== null && (
                      <span className="text-sm text-slate-500">
                        {billing === "yearly" ? " / year" : " / month"}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrent || checkoutPlan === plan.id}
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isCurrent
                        ? "cursor-default bg-slate-100 text-slate-500"
                        : popular
                        ? "bg-cyan-500 text-white hover:bg-cyan-600"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    } disabled:opacity-60`}
                  >
                    {checkoutPlan === plan.id ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Starting checkout...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : (
                      "Upgrade Plan"
                    )}
                  </button>

                  <div className="mt-6 space-y-2 border-t border-slate-100 pt-5">
                    {plan.features &&
                      Object.entries(plan.features)
                        .filter(([, enabled]) => enabled === true)
                        .slice(0, 6)
                        .map(([feature]) => (
                          <div
                            key={feature}
                            className="flex items-center gap-2 text-sm text-slate-600"
                          >
                            <Check
                              size={16}
                              className="shrink-0 text-cyan-500"
                            />
                            {formatFeatureName(feature)}
                          </div>
                        ))}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Billing & Invoice History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <History className="text-slate-500" size={20} />
          <h2 className="text-xl font-bold text-slate-900">
            Payment & Invoice History
          </h2>
        </div>

        <div className="mt-6 overflow-x-auto">
          {history.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No billing transactions found.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="text-slate-700">
                    <td className="py-3.5">
                      {formatDate(item.paidAt ?? item.createdAt)}
                    </td>
                    <td className="py-3.5 font-medium text-slate-900">
                      {item.subscription?.plan?.name ?? "Subscription Plan"}
                    </td>
                    <td className="py-3.5">
                      {formatPrice(item.amount, item.currency)}
                    </td>
                    <td className="py-3.5 font-mono text-xs text-slate-500">
                      {item.reference}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === "PENDING"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Cancel Subscription?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Your subscription will remain active until the end of your
              current billing period on{" "}
              {formatDate(activeSubscription?.currentPeriodEnd ?? null)}. After
              that date, your account will revert to the Free tier.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling && <Loader2 size={15} className="animate-spin" />}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

