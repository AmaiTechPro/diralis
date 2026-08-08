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
} from "lucide-react";

import {
  getPlans,
  getSubscription,
  getEntitlements,
  createCheckout,
} from "../services/billingService";

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

interface Subscription {
  id: string;
  status: string;
  interval: "MONTHLY" | "YEARLY";
  provider: string;
  plan: BillingPlan;
}

interface Entitlements {
  plan: {
    id: string;
    code: string;
    name: string;
  };
  limits: Record<string, number | null>;
  features: Record<string, boolean>;
}

const planIcons: Record<string, typeof Sparkles> = {
  FREE: Sparkles,
  STARTER: Zap,
  PRO: Rocket,
  BUSINESS: Building2,
  CUSTOM: Crown,
};

function formatPrice(
  price: number | null,
  currency: string
) {
  if (price === null) {
    return "Custom";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price / 100);
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
      .replace(/^./, (letter) =>
        letter.toUpperCase()
      )
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

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (letter) =>
      letter.toUpperCase()
    );
}

export default function Billing() {
  const { token } = useAuth();

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [entitlements, setEntitlements] =
    useState<Entitlements | null>(null);

  const [billing, setBilling] =
    useState<"monthly" | "yearly">("yearly");

  const [loading, setLoading] =
    useState(true);

  const [checkoutPlan, setCheckoutPlan] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadBilling() {
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          plansResponse,
          subscriptionResponse,
          entitlementsResponse,
        ] = await Promise.all([
          getPlans(),
          getSubscription(token),
          getEntitlements(token),
        ]);

        setPlans(
          Array.isArray(plansResponse)
            ? plansResponse
            : plansResponse?.plans ?? []
        );

        setSubscription(
          subscriptionResponse?.subscription ?? null
        );

        setEntitlements(
          entitlementsResponse ?? null
        );
      } catch (err) {
        console.error(
          "Failed to load billing:",
          err
        );

        setError(
          "Unable to load your billing information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBilling();
  }, [token]);

  async function handleUpgrade(
    plan: BillingPlan
  ) {
    if (!token) {
      return;
    }

    if (plan.code === "CUSTOM") {
      window.location.href = "/contact";
      return;
    }

    if (plan.code === "FREE") {
      return;
    }

    try {
      setCheckoutPlan(plan.id);

      const response =
        await createCheckout(
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
        window.location.href =
          response.url;
        return;
      }

      throw new Error(
        "No checkout URL returned."
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2
            className="animate-spin"
            size={22}
          />
          Loading billing...
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

  const currentPlan =
    subscription?.plan ??
    plans.find(
      (plan) =>
        plan.code ===
        entitlements?.plan?.code
    ) ??
    plans.find(
      (plan) => plan.code === "FREE"
    );

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* Header */}

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
            <CreditCard
              className="text-cyan-500"
              size={23}
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Billing
            </h1>

            <p className="mt-1 text-slate-500">
              Turn Business Data into Better Decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Current Plan */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-sm font-medium text-slate-500">
              Current Plan
            </p>

            <div className="mt-2 flex items-center gap-3">

              <h2 className="text-3xl font-bold text-slate-900">
                {currentPlan?.name ?? "Free"}
              </h2>

              {subscription && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {formatStatus(
                    subscription.status
                  )}
                </span>
              )}

            </div>

            {subscription && (
              <p className="mt-2 text-sm text-slate-500">
                Billed{" "}
                {subscription.interval ===
                "YEARLY"
                  ? "yearly"
                  : "monthly"}
              </p>
            )}
          </div>

          {currentPlan && (
            <div className="text-left lg:text-right">

              <p className="text-sm text-slate-500">
                Current price
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {formatPrice(
                  subscription?.interval ===
                    "MONTHLY"
                    ? currentPlan.monthlyPrice
                    : currentPlan.annualPrice,
                  currentPlan.currency
                )}
              </p>

            </div>
          )}

        </div>

        {/* Entitlements */}

        {entitlements && (
          <div className="mt-8 grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Plan limits
              </p>

              <div className="space-y-2">

                {Object.entries(
                  entitlements.limits ?? {}
                ).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between gap-4 text-sm"
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

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Included features
              </p>

              <div className="grid gap-2 sm:grid-cols-2">

                {Object.entries(
                  entitlements.features ?? {}
                )
                  .filter(
                    ([, enabled]) =>
                      enabled === true
                  )
                  .map(([feature]) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <Check
                        size={17}
                        className="text-cyan-500"
                      />

                      {formatFeatureName(
                        feature
                      )}
                    </div>
                  ))}

              </div>
            </div>

          </div>
        )}

      </section>

      {/* Upgrade */}

      <section>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Upgrade your plan
            </h2>

            <p className="mt-1 text-slate-500">
              Choose the intelligence level that fits your business.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1">

            <button
              onClick={() =>
                setBilling("monthly")
              }
              className={`rounded-lg px-5 py-2 text-sm font-medium ${
                billing === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() =>
                setBilling("yearly")
              }
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
            .filter(
              (plan) =>
                plan.code !== "FREE"
            )
            .map((plan) => {

              const Icon =
                planIcons[plan.code] ??
                Sparkles;

              const price =
                billing === "monthly"
                  ? plan.monthlyPrice
                  : plan.annualPrice;

              const isCurrent =
                currentPlan?.id ===
                plan.id;

              const popular =
                plan.code === "PRO";

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
                    <Icon
                      size={22}
                      className="text-cyan-600"
                    />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    {plan.name}
                  </h3>

                  <p className="mt-2 min-h-[48px] text-sm text-slate-500">
                    {plan.description}
                  </p>

                  <div className="mt-5">

                    <span className="text-2xl font-bold text-slate-900">
                      {formatPrice(
                        price,
                        plan.currency
                      )}
                    </span>

                    {price !== null && (
                      <span className="text-sm text-slate-500">
                        {billing ===
                        "yearly"
                          ? " / year"
                          : " / month"}
                      </span>
                    )}

                  </div>

                  <button
                    onClick={() =>
                      handleUpgrade(
                        plan
                      )
                    }
                    disabled={
                      isCurrent ||
                      checkoutPlan ===
                        plan.id
                    }
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isCurrent
                        ? "cursor-default bg-slate-100 text-slate-500"
                        : popular
                        ? "bg-cyan-500 text-white hover:bg-cyan-600"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    } disabled:opacity-60`}
                  >
                    {checkoutPlan ===
                    plan.id ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
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
                      Object.entries(
                        plan.features
                      )
                        .filter(
                          ([, enabled]) =>
                            enabled === true
                        )
                        .slice(0, 6)
                        .map(
                          ([feature]) => (
                            <div
                              key={
                                feature
                              }
                              className="flex items-center gap-2 text-sm text-slate-600"
                            >
                              <Check
                                size={16}
                                className="shrink-0 text-cyan-500"
                              />

                              {formatFeatureName(
                                feature
                              )}
                            </div>
                          )
                        )}

                  </div>

                </div>
              );
            })}

        </div>

      </section>

      {/* Pricing Link */}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">

        <p className="text-sm text-slate-500">
          Need a detailed comparison of all
          Diralis plans?
        </p>

        <a
          href="/pricing"
          className="mt-2 inline-block font-semibold text-cyan-600 hover:text-cyan-700"
        >
          View full pricing comparison →
        </a>

      </div>

    </div>
  );
}
