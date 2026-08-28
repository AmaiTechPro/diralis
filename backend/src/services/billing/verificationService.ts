import {
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "../../lib/prisma";
import { getPaymentProvider } from "./providers/providerFactory";

export async function verifyBillingPayment(reference: string) {
  if (!reference) {
    throw new Error("PAYMENT_REFERENCE_REQUIRED");
  }

  // Find the payment created during checkout
  const payment = await prisma.payment.findUnique({
    where: {
      providerReference: reference,
    },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  // Already processed — return idempotent response
  if (payment.status === PaymentStatus.SUCCESS) {
    return {
      success: true,
      alreadyVerified: true,
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
      plan: payment.subscription?.plan
        ? {
            id: payment.subscription.plan.id,
            code: payment.subscription.plan.code,
            name: payment.subscription.plan.name,
          }
        : null,
    };
  }

  const provider = getPaymentProvider(payment.provider);

  // Ask the payment provider directly
  const verification = await provider.verifyPayment(reference);

  if (!verification.successful) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
        metadata: (verification.metadata as any) ?? undefined,
      },
    });

    throw new Error("PAYMENT_NOT_SUCCESSFUL");
  }

  // Security verification checks
  if (verification.reference !== payment.providerReference) {
    throw new Error("PAYMENT_REFERENCE_MISMATCH");
  }

  if (
    verification.amount !== undefined &&
    verification.amount !== payment.amount
  ) {
    throw new Error("PAYMENT_AMOUNT_MISMATCH");
  }

  if (
    verification.currency &&
    verification.currency.toUpperCase() !== payment.currency.toUpperCase()
  ) {
    throw new Error("PAYMENT_CURRENCY_MISMATCH");
  }

  const now = new Date();
  const periodEnd = new Date(now);

  if (payment.subscription?.interval === "YEARLY") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  const currentKey = `${payment.userId}_current`;

  // Atomic database update
  await prisma.$transaction(async (tx) => {
    // 1. Mark payment SUCCESS
    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.SUCCESS,
        paidAt: now,
        metadata: (verification.metadata as any) ?? undefined,
      },
    });

    // 2. Clear currentKey on any previous active subscription for this user
    if (payment.subscriptionId) {
      await tx.subscription.updateMany({
        where: {
          userId: payment.userId,
          currentKey,
          id: {
            not: payment.subscriptionId,
          },
        },
        data: {
          currentKey: null,
          status: SubscriptionStatus.EXPIRED,
        },
      });

      // 3. Set the new subscription as ACTIVE with currentKey
      await tx.subscription.update({
        where: {
          id: payment.subscriptionId,
        },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentKey,
          providerCustomerId:
            verification.providerCustomerId ?? undefined,
          providerSubscriptionId:
            verification.providerSubscriptionId ?? undefined,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }
  });

  return {
    success: true,
    alreadyVerified: false,
    paymentId: payment.id,
    subscriptionId: payment.subscriptionId,
    plan: payment.subscription?.plan
      ? {
          id: payment.subscription.plan.id,
          code: payment.subscription.plan.code,
          name: payment.subscription.plan.name,
        }
      : null,
    amount: payment.amount,
    currency: payment.currency,
  };
}


