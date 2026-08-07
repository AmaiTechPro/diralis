import prisma from "../lib/prisma";

import { BillingInterval, BillingProvider } from "@prisma/client";
import { getPaymentProvider } from "./billing/providerFactory";




/**
 * Get all active subscription plans.
 */
export async function getActivePlans() {
  return prisma.subscriptionPlan.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        monthlyPrice: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
}

/**
 * Get the user's current subscription.
 *
 * Diralis keeps one current subscription per customer,
 * while historical subscriptions remain in the database.
 */
export async function getCurrentSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: ["ACTIVE", "TRIALING", "PAST_DUE", "INCOMPLETE"],
      },
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get the user's current plan.
 *
 * Users without a subscription automatically fall back to FREE.
 */
export async function getUserPlan(userId: string) {
  const subscription = await getCurrentSubscription(userId);

  if (subscription) {
    return subscription.plan;
  }

  return prisma.subscriptionPlan.findFirst({
    where: {
      code: "FREE",
      active: true,
    },
    orderBy: {
      version: "desc",
    },
  });
}

/**
 * Get the user's effective subscription entitlements.
 */
export async function getUserEntitlements(userId: string) {
  const plan = await getUserPlan(userId);

  if (!plan) {
    throw new Error("FREE plan is not configured.");
  }

  return {
    plan: {
      id: plan.id,
      code: plan.code,
      name: plan.name,
    },
    limits: plan.limits ?? {},
    features: plan.features ?? {},
  };
}

/**
 * Check whether a feature is available to the user.
 */
export async function hasFeature(
  userId: string,
  feature: string
): Promise<boolean> {
  const plan = await getUserPlan(userId);

  if (!plan) {
    return false;
  }

  const features =
    (plan.features as Record<string, unknown> | null) ?? {};

  return features[feature] === true;
}

/**
 * Get a specific usage limit from the user's plan.
 *
 * null means unlimited / custom-configured.
 */
export async function getUsageLimit(
  userId: string,
  resource: string
): Promise<number | null> {
  const plan = await getUserPlan(userId);

  if (!plan) {
    return 0;
  }

  const limits =
    (plan.limits as Record<string, unknown> | null) ?? {};

  const value = limits[resource];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "number") {
    throw new Error(
      `Invalid limit configuration for resource: ${resource}`
    );
  }

  return value;
}


{/* Check out services */}

export async function createCheckout(
  userId: string,
  planCode: string,
  interval: BillingInterval
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }


  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      code: planCode,
      active: true,
    },
    orderBy: {
      version: "desc",
    },
  });


  if (!plan) {
    throw new Error("Subscription plan not found.");
  }


  if (plan.code === "FREE") {
    throw new Error(
      "The FREE plan does not require checkout."
    );
  }


  const amount =
    interval === BillingInterval.MONTHLY
      ? plan.monthlyPrice
      : plan.annualPrice;


  if (amount === null || amount === undefined) {
    throw new Error(
      `Pricing has not been configured for the ${plan.name} plan.`
    );
  }


  if (amount <= 0) {
    throw new Error(
      "Checkout requires a valid positive amount."
    );
  }


  const providerConfig =
    await prisma.billingProviderConfig.findFirst({
      where: {
        enabled: true,
      },
      orderBy: [
        {
          priority: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });


  if (!providerConfig) {
    throw new Error(
      "No billing provider is currently enabled."
    );
  }


  const provider = getPaymentProvider(
    providerConfig.provider as BillingProvider
  );


  const callbackUrl =
    process.env.BILLING_CALLBACK_URL ||
    `${process.env.FRONTEND_URL}/billing/verify`;







const subscription =
  await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: "INCOMPLETE",
      provider: provider.name,
      interval,
    },
  });

  return provider.createCheckout({
  userId,
  subscriptionId: subscription.id,
  planId: plan.id,
  interval,
  email: user.email,
  amount,
  currency: plan.currency,
  callbackUrl,
});
}

