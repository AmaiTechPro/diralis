import { SubscriptionStatus } from "@prisma/client";
import prisma from "../../lib/prisma";
import { getPaymentProvider } from "./providers/providerFactory";

interface CancelSubscriptionOptions {
  immediately?: boolean;
}

export async function cancelUserSubscription(
  userId: string,
  options: CancelSubscriptionOptions = {}
) {
  const currentKey = `${userId}_current`;

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      currentKey,
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      },
    },
    include: {
      plan: true,
    },
  });

  if (!subscription) {
    throw new Error("NO_ACTIVE_SUBSCRIPTION_FOUND");
  }

  // Cancel with provider if provider subscription ID exists
  if (subscription.provider && subscription.providerSubscriptionId) {
    try {
      const provider = getPaymentProvider(subscription.provider);
      await provider.cancelSubscription(subscription.providerSubscriptionId);
    } catch (providerError) {
      console.error("Provider subscription cancellation error:", providerError);
    }
  }

  const now = new Date();

  if (options.immediately) {
    // Immediate cancellation: clear currentKey and mark CANCELLED immediately
    const updated = await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: SubscriptionStatus.CANCELLED,
        currentKey: null,
        cancelAtPeriodEnd: false,
        cancelledAt: now,
      },
      include: {
        plan: true,
      },
    });

    return {
      success: true,
      cancelledImmediately: true,
      subscription: {
        id: updated.id,
        status: updated.status,
        cancelledAt: updated.cancelledAt,
        plan: {
          id: updated.plan.id,
          code: updated.plan.code,
          name: updated.plan.name,
        },
      },
    };
  }

  // Cancel at period end: retain active entitlement until period ends
  const updated = await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      cancelAtPeriodEnd: true,
      cancelledAt: now,
    },
    include: {
      plan: true,
    },
  });

  return {
    success: true,
    cancelledImmediately: false,
    cancelAtPeriodEnd: true,
    currentPeriodEnd: updated.currentPeriodEnd,
    subscription: {
      id: updated.id,
      status: updated.status,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      cancelledAt: updated.cancelledAt,
      currentPeriodEnd: updated.currentPeriodEnd,
      plan: {
        id: updated.plan.id,
        code: updated.plan.code,
        name: updated.plan.name,
      },
    },
  };
}

