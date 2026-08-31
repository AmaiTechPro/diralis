import {
  BillingProvider,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "../../lib/prisma";
import {
  sendPaymentSuccessEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionCancelledEmail,
  sendPaymentFailedEmail,
} from "../emailService";

interface BillingWebhookInput {
  provider: BillingProvider;
  eventId: string;
  eventType: string;
  payload?: unknown;
}

export async function processBillingWebhook(input: BillingWebhookInput) {
  const { provider, eventId, eventType, payload } = input;

  // --------------------------------------------------
  // 1. Idempotency check
  // --------------------------------------------------
  const existingEvent = await prisma.billingWebhookEvent.findUnique({
    where: {
      provider_eventId: {
        provider,
        eventId,
      },
    },
  });

  if (existingEvent?.processed) {
    return {
      success: true,
      alreadyProcessed: true,
    };
  }

  // --------------------------------------------------
  // 2. Store webhook event record
  // --------------------------------------------------
  const webhookEvent =
    existingEvent ??
    (await prisma.billingWebhookEvent.create({
      data: {
        provider,
        eventId,
        eventType,
        payload:
          payload === undefined ? undefined : (payload as any),
      },
    }));

  try {
    // --------------------------------------------------
    // 3. Process event atomically
    // --------------------------------------------------
    switch (eventType) {
      case "PAYMENT_SUCCESS":
      case "PAYMENT_SUCCESSFUL":
      case "CHARGE_SUCCESS":
        await handleSuccessfulPayment(payload, provider);
        break;

      case "SUBSCRIPTION_ACTIVATED":
      case "SUBSCRIPTION_ACTIVE":
        await handleSubscriptionStatus(
          payload,
          SubscriptionStatus.ACTIVE
        );
        break;

      case "SUBSCRIPTION_CANCELLED":
      case "SUBSCRIPTION_CANCELED":
        await handleSubscriptionStatus(
          payload,
          SubscriptionStatus.CANCELLED
        );
        break;

      case "SUBSCRIPTION_EXPIRED":
        await handleSubscriptionStatus(
          payload,
          SubscriptionStatus.EXPIRED
        );
        break;

      case "PAYMENT_FAILED":
      case "CHARGE_FAILED":
        await handlePaymentFailed(payload);
        break;

      default:
        console.log(`Unhandled billing webhook event: ${eventType}`);
    }

    // --------------------------------------------------
    // 4. Mark webhook event processed
    // --------------------------------------------------
    await prisma.billingWebhookEvent.update({
      where: {
        id: webhookEvent.id,
      },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return {
      success: true,
      alreadyProcessed: false,
    };
  } catch (error) {
    console.error("Billing webhook processing error:", error);
    throw error;
  }
}

// ======================================================
// Helpers
// ======================================================

function getPayloadRecord(payload: unknown): Record<string, unknown> {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new Error("Invalid billing webhook payload.");
  }

  return payload as Record<string, unknown>;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function calculatePeriodEnd(payload: unknown): Date {
  const data = getPayloadRecord(payload);
  const interval = getString(data.interval);
  const end = new Date();

  if (interval === "YEARLY") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  return end;
}

// ======================================================
// Successful payment handler
// ======================================================

async function handleSuccessfulPayment(
  payload: unknown,
  provider: BillingProvider
) {
  const data = getPayloadRecord(payload);

  const userId = getString(data.userId);
  const subscriptionId = getString(data.subscriptionId);
  const providerReference = getString(data.providerReference);
  const amount =
    typeof data.amount === "number" ? data.amount : undefined;
  const currency = getString(data.currency);
  const providerCustomerId = getString(data.providerCustomerId);
  const providerSubscriptionId = getString(data.providerSubscriptionId);

  if (!userId || !providerReference || amount === undefined || !currency) {
    throw new Error("Incomplete successful payment webhook payload.");
  }

  const now = new Date();
  const periodEnd = calculatePeriodEnd(payload);
  const currentKey = `${userId}_current`;

  let userRecord: { email: string; fullName: string } | null = null;
  let planName = "Subscription";

  await prisma.$transaction(async (tx) => {
    // 1. Upsert payment record
    await tx.payment.upsert({
      where: {
        providerReference,
      },
      update: {
        status: PaymentStatus.SUCCESS,
        paidAt: now,
        subscriptionId: subscriptionId ?? undefined,
        metadata: payload as any,
      },
      create: {
        userId,
        subscriptionId: subscriptionId ?? undefined,
        provider,
        providerReference,
        amount,
        currency,
        status: PaymentStatus.SUCCESS,
        paidAt: now,
        metadata: payload as any,
      },
    });

    // 2. Manage subscription and currentKey
    if (subscriptionId) {
      // Clear old active subscription key
      await tx.subscription.updateMany({
        where: {
          userId,
          currentKey,
          id: {
            not: subscriptionId,
          },
        },
        data: {
          currentKey: null,
          status: SubscriptionStatus.EXPIRED,
        },
      });

      // Activate new subscription
      const updatedSub = await tx.subscription.update({
        where: {
          id: subscriptionId,
        },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentKey,
          providerCustomerId: providerCustomerId ?? undefined,
          providerSubscriptionId: providerSubscriptionId ?? undefined,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        include: {
          plan: true,
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });

      userRecord = updatedSub.user;
      planName = updatedSub.plan.name;
    }
  });

  // 3. Dispatch confirmation notification (non-blocking)
  if (!userRecord) {
    userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });
  }

  if (userRecord?.email) {
    try {
      await sendPaymentSuccessEmail(
        userRecord.email,
        userRecord.fullName,
        amount,
        currency,
        planName
      );
    } catch (emailErr) {
      console.warn("Failed to dispatch payment success email:", emailErr);
    }
  }
}

// ======================================================
// Subscription status handler
// ======================================================

async function handleSubscriptionStatus(
  payload: unknown,
  status: SubscriptionStatus
) {
  const data = getPayloadRecord(payload);
  const subscriptionId = getString(data.subscriptionId);

  if (!subscriptionId) {
    throw new Error("Subscription ID is required.");
  }

  const isInactive =
    status === SubscriptionStatus.CANCELLED ||
    status === SubscriptionStatus.EXPIRED;

  const updatedSubscription = await prisma.subscription.update({
    where: {
      id: subscriptionId,
    },
    data: {
      status,
      ...(isInactive ? { currentKey: null } : {}),
      ...(status === SubscriptionStatus.CANCELLED
        ? { cancelledAt: new Date() }
        : {}),
    },
    include: {
      user: {
        select: {
          email: true,
          fullName: true,
        },
      },
      plan: {
        select: {
          name: true,
        },
      },
    },
  });

  // Dispatch lifecycle notification
  if (updatedSubscription.user?.email) {
    try {
      if (status === SubscriptionStatus.CANCELLED) {
        await sendSubscriptionCancelledEmail(
          updatedSubscription.user.email,
          updatedSubscription.user.fullName,
          updatedSubscription.plan.name,
          updatedSubscription.currentPeriodEnd
        );
      } else if (status === SubscriptionStatus.ACTIVE) {
        await sendSubscriptionActivatedEmail(
          updatedSubscription.user.email,
          updatedSubscription.user.fullName,
          updatedSubscription.plan.name,
          updatedSubscription.interval ?? "MONTHLY"
        );
      }
    } catch (emailErr) {
      console.warn("Failed to dispatch subscription status email:", emailErr);
    }
  }
}

// ======================================================
// Failed payment handler
// ======================================================

async function handlePaymentFailed(payload: unknown) {
  const data = getPayloadRecord(payload);
  const providerReference = getString(data.providerReference);
  const userId = getString(data.userId);
  const amount = typeof data.amount === "number" ? data.amount : 0;
  const currency = getString(data.currency) || "USD";

  if (!providerReference) {
    throw new Error("Provider reference is required.");
  }

  await prisma.payment.updateMany({
    where: {
      providerReference,
    },
    data: {
      status: PaymentStatus.FAILED,
    },
  });

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (user?.email) {
      try {
        await sendPaymentFailedEmail(
          user.email,
          user.fullName,
          amount,
          currency
        );
      } catch (emailErr) {
        console.warn("Failed to dispatch payment failed email:", emailErr);
      }
    }
  }
}


