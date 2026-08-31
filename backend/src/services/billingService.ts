import prisma from "../lib/prisma";
import { SubscriptionStatus } from "@prisma/client";

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
 * Diralis tracks the active subscription via the unique currentKey.
 */
export async function getCurrentSubscription(userId: string) {
  const currentKey = `${userId}_current`;

  return prisma.subscription.findFirst({
    where: {
      userId,
      currentKey,
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIALING,
          SubscriptionStatus.PAST_DUE,
        ],
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
 * Users without an active subscription automatically fall back to the FREE plan.
 */
export async function getUserPlan(userId: string) {
  const subscription = await getCurrentSubscription(userId);

  if (subscription && subscription.plan) {
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
 * Calculate user's current resource consumption across database models.
 */
export async function getUserUsageMetrics(userId: string) {
  // Aggregate dataset count and storage footprint
  const datasetAggregate = await prisma.dataset.aggregate({
    where: { userId },
    _count: { id: true },
    _sum: { size: true },
  });

  const datasetsCount = datasetAggregate._count.id || 0;
  const totalSizeBytes = datasetAggregate._sum.size || 0;
  const storageUsedMb = Number((totalSizeBytes / (1024 * 1024)).toFixed(2));

  // Count AI chat messages (user prompt interactions)
  const aiMessagesCount = await prisma.chatMessage.count({
    where: {
      session: {
        userId,
      },
      role: "user",
    },
  });

  return {
    datasets: datasetsCount,
    storageMb: storageUsedMb,
    aiRequestsPerMonth: aiMessagesCount,
    monthlyExports: 0,
    forecastsPerMonth: 0,
    teamMembers: 1,
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

/**
 * Get complete billing overview for the user.
 */
export async function getBillingOverview(userId: string) {
  const subscription = await getCurrentSubscription(userId);
  const plan = await getUserPlan(userId);
  const entitlements = await getUserEntitlements(userId);
  const usage = await getUserUsageMetrics(userId);

  return {
    hasActiveSubscription: !!subscription,
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          interval: subscription.interval,
          provider: subscription.provider,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          cancelledAt: subscription.cancelledAt,
        }
      : null,
    plan: plan
      ? {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          currency: plan.currency,
          monthlyPrice: plan.monthlyPrice,
          annualPrice: plan.annualPrice,
        }
      : null,
    entitlements: {
      limits: entitlements.limits,
      features: entitlements.features,
    },
    usage,
  };
}


