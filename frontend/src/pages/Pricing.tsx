import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Sparkles,
  Rocket,
  Building2,
  Crown,
  Zap,
} from "lucide-react";

import {
  getPlans,
  createCheckout,
  type SubscriptionPlan,
} from "../services/billingService";
import { useAuth } from "../context/AuthContext";

const planIcons: Record<string, typeof Sparkles> = {
  FREE: Sparkles,
  STARTER: Zap,
  PRO: Rocket,
  BUSINESS: Building2,
  CUSTOM: Crown,
};

const popularPlans = new Set(["PRO"]);

function formatPrice(price: number | null, currency: string) {
  if (price === null) {
    return "Custom";
  }

  const amount = price / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
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

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        setError(null);

        const response = await getPlans();

        setPlans(
          Array.isArray(response) ? response : response.plans ?? []
        );
      } catch (err) {
        console.error("Failed to load billing plans:", err);
        setError("Unable to load pricing plans. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  async function handlePlanAction(plan: SubscriptionPlan) {
    if (plan.code === "CUSTOM") {
      window.location.href = "/contact";
      return;
    }

    if (plan.code === "FREE") {
      window.location.href = isAuthenticated ? "/dashboard" : "/register";
      return;
    }

    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

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

      console.log("Checkout response:", response);
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to Diralis
      </Link>

      {/* Header */}
      <div className="mt-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900">
          Simple Pricing That Scales With You
        </h1>

        <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
          Choose the intelligence level that fits your business. Upgrade as
          your organization grows.
        </p>

        {/* Billing Toggle */}
        <div className="mt-6 inline-flex rounded-xl bg-white p-1 shadow-sm">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-lg px-5 py-2 ${
              billing === "monthly"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Monthly
          </button>

          <button
            onClick={() => setBilling("yearly")}
            className={`rounded-lg px-5 py-2 ${
              billing === "yearly"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-16 text-center text-slate-600">
          Loading pricing plans...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-16 rounded-xl bg-red-50 p-6 text-center text-red-700">
          {error}
        </div>
      )}

      {/* Plans */}
      {!loading && !error && (
        <>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {plans.map((plan) => {
              const Icon = planIcons[plan.code] ?? Sparkles;
              const popular = popularPlans.has(plan.code);
              const price =
                billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
              const isCustom = plan.code === "CUSTOM";
              const isFree = plan.code === "FREE";

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl bg-white p-6 shadow-sm ${
                    popular ? "ring-2 ring-blue-600" : ""
                  }`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </div>
                  )}

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-slate-900">
                    {plan.name}
                  </h2>

                  <p className="mt-3 min-h-[72px] text-sm text-slate-600">
                    {plan.description}
                  </p>

                  <div className="mt-6">
                    <span className="text-3xl font-bold text-slate-900">
                      {formatPrice(price, plan.currency)}
                    </span>

                    {!isCustom && !isFree && price !== null && (
                      <span className="text-sm text-slate-500">
                        {billing === "monthly" ? " / month" : " / year"}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handlePlanAction(plan)}
                    disabled={checkoutPlan === plan.id}
                    className={`mt-6 w-full rounded-xl px-5 py-3 font-medium transition ${
                      popular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {checkoutPlan === plan.id
                      ? "Starting checkout..."
                      : isCustom
                      ? "Contact Sales"
                      : isFree
                      ? "Get Started"
                      : isAuthenticated
                      ? "Upgrade Plan"
                      : "Get Started"}
                  </button>

                  {/* Features */}
                  <div className="mt-8 space-y-3">
                    {plan.features &&
                      Object.entries(plan.features)
                        .filter(([, enabled]) => enabled === true)
                        .map(([feature]) => (
                          <div
                            key={feature}
                            className="flex gap-3 text-sm text-slate-700"
                          >
                            <Check className="h-5 w-5 shrink-0 text-blue-600" />
                            <span>{formatFeatureName(feature)}</span>
                          </div>
                        ))}
                  </div>

                  {/* Limits */}
                  {plan.limits && (
                    <div className="mt-6 border-t pt-6">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Plan limits
                      </p>
                      <div className="space-y-2">
                        {Object.entries(plan.limits).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between gap-3 text-xs"
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
                  )}
                </div>
              );
            })}
          </div>

          {/* Comparison */}
          <div className="mt-16 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Compare Plans
            </h2>

            <p className="mt-3 text-center text-slate-600">
              See exactly what each Diralis plan provides.
            </p>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-4">Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="p-4">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {[
                    "analytics",
                    "forecasting",
                    "reports",
                    "aiChat",
                    "aiAgent",
                    "advancedAnalytics",
                    "integrations",
                    "prioritySupport",
                    "dedicatedSupport",
                  ].map((feature) => (
                    <tr key={feature} className="border-b">
                      <td className="p-4 font-medium text-slate-700">
                        {formatFeatureName(feature)}
                      </td>

                      {plans.map((plan) => (
                        <td key={plan.id} className="p-4">
                          {plan.features?.[feature] ? (
                            <Check className="h-5 w-5 text-blue-600" />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

