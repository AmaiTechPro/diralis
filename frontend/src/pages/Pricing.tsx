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

import { getPlans, createCheckout } from "../services/billingService";
import { useAuth } from "../context/AuthContext";

interface BillingPlan {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string | null;
  monthlyPrice: number | null;
  annualPrice: number | null;
  currency: string;
  limits: Record<string, number | null> | null;
  features: Record<string, boolean> | null;
  active: boolean;
}

const planIcons: Record<string, typeof Sparkles> = {
  FREE: Sparkles,
  STARTER: Zap,
  PRO: Rocket,
  BUSINESS: Building2,
  CUSTOM: Crown,
};

const popularPlans = new Set(["PRO"]);

function formatPrice(
  price: number | null,
  currency: string
) {
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

function formatFeatureName(
  key: string
) {
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
      .replace(/^./, (letter) =>
        letter.toUpperCase()
      )
  );
}

function formatLimitName(
  key: string
) {
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
      .replace(/^./, (letter) =>
        letter.toUpperCase()
      )
  );
}

function formatLimitValue(
  key: string,
  value: number | null
) {
  if (value === null) {
    return "Unlimited";
  }

  if (key === "storageMb") {
    if (value >= 1000) {
      return `${value / 1000} GB`;
    }

    return `${value} MB`;
  }

  return value.toLocaleString();
}

export default function Pricing() {
  const { token, isAuthenticated } = useAuth();

  const [billing, setBilling] =
    useState<"monthly" | "yearly">("monthly");

  const [plans, setPlans] =
    useState<BillingPlan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [checkoutPlan, setCheckoutPlan] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        setError(null);

        const response = await getPlans();

        setPlans(
          Array.isArray(response)
            ? response
            : response.plans ?? []
        );
      } catch (err) {
        console.error(
          "Failed to load billing plans:",
          err
        );

        setError(
          "Unable to load pricing plans. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  async function handlePlanAction(
    plan: BillingPlan
  ) {
    if (plan.code === "CUSTOM") {
      window.location.href = "/contact";
      return;
    }

    if (plan.code === "FREE") {
      window.location.href = isAuthenticated
        ? "/dashboard"
        : "/register";

      return;
    }

    if (!isAuthenticated || !token) {
      window.location.href = "/login";
      return;
    }

    try {
      setCheckoutPlan(plan.id);

      const response = await createCheckout(
        plan.id,
        billing === "monthly"
          ? "MONTHLY"
          : "YEARLY",
        token
      );

      if (response?.checkoutUrl) {
        window.location.href =
          response.checkoutUrl;
        return;
      }

      if (response?.url) {
        window.location.href = response.url;
        return;
      }

      console.log(
        "Checkout response:",
        response
      );
    } catch (err) {
      console.error(
        "Checkout failed:",
        err
      );

      alert(
        "Unable to start checkout. Please try again."
      );
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
          Choose the intelligence level that fits
          your business. Upgrade as your organization
          grows.
        </p>

        {/* Billing Toggle */}
        <div className="mt-6 inline-flex rounded-xl bg-white p-1 shadow-sm">

          <button
            onClick={() =>
              setBilling("monthly")
            }
            className={`rounded-lg px-5 py-2 ${
              billing === "monthly"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Monthly
          </button>

          <button
            onClick={() =>
              setBilling("yearly")
            }
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
              const Icon =
                planIcons[plan.code] ??
                Sparkles;

              const popular =
                popularPlans.has(plan.code);

              const price =
                billing === "monthly"
                  ? plan.monthlyPrice
                  : plan.annualPrice;

              const isCustom =
                plan.code === "CUSTOM";

              const isFree =
                plan.code === "FREE";

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl bg-white p-6 shadow-sm ${
                    popular
                      ? "ring-2 ring-blue-600"
                      : ""
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
                      {formatPrice(
                        price,
                        plan.currency
                      )}
                    </span>

                    {!isCustom &&
                      !isFree &&
                      price !== null && (
                        <span className="text-sm text-slate-500">
                          {billing === "monthly"
                            ? " / month"
                            : " / year"}
                        </span>
                      )}

                  </div>

                  <button
                    onClick={() =>
                      handlePlanAction(plan)
                    }
                    disabled={
                      checkoutPlan === plan.id
                    }
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
                      Object.entries(
                        plan.features
                      )
                        .filter(
                          ([, enabled]) =>
                            enabled === true
                        )
                        .map(([feature]) => (
                          <div
                            key={feature}
                            className="flex gap-3 text-sm text-slate-700"
                          >
                            <Check className="h-5 w-5 shrink-0 text-blue-600" />

                            <span>
                              {formatFeatureName(
                                feature
                              )}
                            </span>
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

                        {Object.entries(
                          plan.limits
                        ).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between gap-3 text-xs"
                            >
                              <span className="text-slate-500">
                                {formatLimitName(
                                  key
                                )}
                              </span>

                              <span className="font-medium text-slate-700">
                                {formatLimitValue(
                                  key,
                                  value
                                )}
                              </span>
                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )}

                </div>
              );
            })}

          </div>
         {/* Compare Plan */}
<table className="w-full min-w-[1000px] text-left">

  <thead>
    <tr className="border-b">

      <th className="p-4 text-left text-sm font-semibold text-slate-700">
        Feature
      </th>

      {/* Plan 1 — Free */}
      <th className="p-4 text-center text-sm font-semibold text-slate-700">
        <div>Free</div>
        <div className="mt-2 text-sm font-bold text-slate-900">
          $0
        </div>
        <div className="text-xs font-normal text-slate-500">
          Forever
        </div>
      </th>

      {/* Plan 2 — Starter */}
      <th className="p-4 text-center text-sm font-semibold text-slate-700">
        <div>Starter</div>
        <div className="mt-2 text-sm font-bold text-slate-900">
          {billing === "monthly" ? "$15" : "$144"}
        </div>
        <div className="text-xs font-normal text-slate-500">
          /{billing === "monthly" ? "month" : "year"}
        </div>
      </th>

      {/* Plan 3 — Pro */}
      <th className="p-4 text-center text-sm font-semibold text-blue-600">
        <div>Pro</div>

        <div className="mt-1 text-xs font-medium text-blue-600">
          Most Popular
        </div>

        <div className="mt-2 text-sm font-bold text-slate-900">
          {billing === "monthly" ? "$39" : "$390"}
        </div>

        <div className="text-xs font-normal text-slate-500">
          /{billing === "monthly" ? "month" : "year"}
        </div>
      </th>

      {/* Plan 4 — Business */}
      <th className="p-4 text-center text-sm font-semibold text-slate-700">
        <div>Business</div>
        <div className="mt-2 text-sm font-bold text-slate-900">
          {billing === "monthly" ? "$99" : "$990"}
        </div>
        <div className="text-xs font-normal text-slate-500">
          /{billing === "monthly" ? "month" : "year"}
        </div>
      </th>

      {/* Plan 5 — Custom */}
      <th className="p-4 text-center text-sm font-semibold text-slate-700">
        <div>Custom</div>
        <div className="mt-2 text-sm font-bold text-slate-900">
          Contact Sales
        </div>
        <div className="text-xs font-normal text-slate-500">
          Tailored pricing
        </div>
      </th>

    </tr>
  </thead>

  <tbody>

    {/* Analytics */}
    <tr className="border-b">
      <td className="p-4 font-medium text-slate-700">
        Analytics
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>
    </tr>

    {/* Forecasting */}
    <tr className="border-b">
      <td className="p-4 font-medium text-slate-700">
        Forecasting
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>
    </tr>

    {/* Reports */}
    <tr className="border-b">
      <td className="p-4 font-medium text-slate-700">
        Reports
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>
    </tr>

    {/* AI Chat */}
    <tr className="border-b">
      <td className="p-4 font-medium text-slate-700">
        AI Chat
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>
    </tr>

    {/* AI Agent */}
    <tr className="border-b">
      <td className="p-4 font-medium text-slate-700">
        AI Agent
      </td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>
    </tr>

    {/* Advanced Analytics */}
    <tr className="border-b">
      <td className="p-4 font-medium text-slate-700">
        Advanced Analytics
      </td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>
    </tr>

    {/* Integrations */}
    <tr className="border-b">
      <td className="p-4 font-medium text-slate-700">
        Integrations
      </td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>
    </tr>

    {/* Priority Support */}
    <tr className="border-b">
      <td className="p-4 font-medium text-slate-700">
        Priority Support
      </td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>
    </tr>

    {/* Dedicated Support */}
    <tr>
      <td className="p-4 font-medium text-slate-700">
        Dedicated Support
      </td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center text-slate-300">—</td>

      <td className="p-4 text-center">
        <Check className="mx-auto h-5 w-5 text-blue-600" />
      </td>
    </tr>

  </tbody>

</table>


      

        </>
      )}

    </div>
  );
}

