{/*
import {
  BillingProvider,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "../../lib/prisma";

interface BillingWebhookInput {
  provider: BillingProvider;
  eventId: string;
  eventType: string;
  payload?: unknown;
}

export async function processBillingWebhook(
  input: BillingWebhookInput
) {
  const {
    provider,
    eventId,
    eventType,
    payload,
  } = input;

  // --------------------------------------------------
  // 1. Idempotency check
  // --------------------------------------------------

  const existingEvent =
    await prisma.billingWebhookEvent.findUnique({
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
  // 2. Store webhook event
  // --------------------------------------------------

  const webhookEvent =
    existingEvent ??
    await prisma.billingWebhookEvent.create({
      data: {
        provider,
        eventId,
        eventType,
        payload:
          payload === undefined
            ? undefined
            : (payload as any),
      },
    });

  try {
    // --------------------------------------------------
    // 3. Process event
    // --------------------------------------------------

    switch (eventType) {
      case "PAYMENT_SUCCESS":
      case "PAYMENT_SUCCESSFUL":
      case "CHARGE_SUCCESS":

        await handleSuccessfulPayment(
          payload,
          provider
        );

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

        console.log(
          `ℹ️ Unhandled billing event: ${eventType}`
        );
    }

    // --------------------------------------------------
    // 4. Mark webhook processed
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

    console.error(
      "Billing webhook processing failed:",
      error
    );

    throw error;
  }
}

// ======================================================
// Helpers
// ======================================================

function getPayloadRecord(
  payload: unknown
): Record<string, unknown> {

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new Error(
      "Invalid billing webhook payload."
    );
  }

  return payload as Record<string, unknown>;
}

function getString(
  value: unknown
): string | undefined {

  return typeof value === "string"
    ? value
    : undefined;
}

// ======================================================
// Successful payment
// ======================================================

async function handleSuccessfulPayment(
  payload: unknown,
  provider: BillingProvider
) {
  const data =
    getPayloadRecord(payload);

  const userId =
    getString(data.userId);

  const subscriptionId =
    getString(data.subscriptionId);

  const providerReference =
    getString(data.providerReference);

  const amount =
    typeof data.amount === "number"
      ? data.amount
      : undefined;

  const currency =
    getString(data.currency);

  const providerCustomerId =
    getString(data.providerCustomerId);

  const providerSubscriptionId =
    getString(data.providerSubscriptionId);

  // --------------------------------------------------
  // Validate required payment fields
  // --------------------------------------------------

  if (
    !userId ||
    !providerReference ||
    amount === undefined ||
    !currency
  ) {
    throw new Error(
      "Incomplete successful payment webhook payload."
    );
  }

  // --------------------------------------------------
  // Explicitly narrowed values
  // --------------------------------------------------

  const verifiedUserId = userId;
  const verifiedProviderReference =
    providerReference;
  const verifiedAmount = amount;
  const verifiedCurrency = currency;
  const verifiedProvider = provider;

  // --------------------------------------------------
  // Create or update payment
  // --------------------------------------------------

  await prisma.payment.upsert({
    where: {
      providerReference:
        verifiedProviderReference,
    },

    update: {
      status:
        PaymentStatus.SUCCESS,

      paidAt:
        new Date(),

      subscriptionId:
        subscriptionId ?? undefined,

      metadata:
        payload as any,
    },

    create: {
      userId:
        verifiedUserId,

      subscriptionId:
        subscriptionId ?? undefined,

      provider:
        verifiedProvider,

      providerReference:
        verifiedProviderReference,

      amount:
        verifiedAmount,

      currency:
        verifiedCurrency,

      status:
        PaymentStatus.SUCCESS,

      paidAt:
        new Date(),

      metadata:
        payload as any,
    },
  });

  // --------------------------------------------------
  // Activate subscription
  // --------------------------------------------------

  if (subscriptionId) {
    await prisma.subscription.update({
      where: {
        id: subscriptionId,
      },

      data: {
        status:
          SubscriptionStatus.ACTIVE,

        providerCustomerId:
          providerCustomerId ?? undefined,

        providerSubscriptionId:
          providerSubscriptionId ?? undefined,

        currentPeriodStart:
          new Date(),

        currentPeriodEnd:
          calculatePeriodEnd(payload),
      },
    });
  }
}

// ======================================================
// Subscription status handler
// ======================================================

async function handleSubscriptionStatus(
  payload: unknown,
  status: SubscriptionStatus
) {
  const data =
    getPayloadRecord(payload);

  const subscriptionId =
    getString(data.subscriptionId);

  if (!subscriptionId) {
    throw new Error(
      "Subscription ID is required."
    );
  }

  await prisma.subscription.update({
    where: {
      id: subscriptionId,
    },

    data: {
      status,

      ...(status ===
      SubscriptionStatus.CANCELLED
        ? {
            cancelledAt:
              new Date(),
          }
        : {}),
    },
  });
}

// ======================================================
// Failed payment
// ======================================================

async function handlePaymentFailed(
  payload: unknown
) {
  const data =
    getPayloadRecord(payload);

  const providerReference =
    getString(data.providerReference);

  if (!providerReference) {
    throw new Error(
      "Provider reference is required."
    );
  }

  await prisma.payment.updateMany({
    where: {
      providerReference,
    },

    data: {
      status:
        PaymentStatus.FAILED,
    },
  });
}

// ======================================================
// Calculate subscription period end
// ======================================================

function calculatePeriodEnd(
  payload: unknown
): Date {
  const data =
    getPayloadRecord(payload);

  const interval =
    getString(data.interval);

  const end =
    new Date();

  if (interval === "YEARLY") {
    end.setFullYear(
      end.getFullYear() + 1
    );
  } else {
    end.setMonth(
      end.getMonth() + 1
    );
  }

  return end;
}
 */}



 {/*Updated codes! */}


 import {
  BillingProvider,
  PaymentStatus,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "../../lib/prisma";

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
      await tx.subscription.update({
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
      });
    }
  });
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

  await prisma.subscription.update({
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
  });
}

// ======================================================
// Failed payment handler
// ======================================================

async function handlePaymentFailed(payload: unknown) {
  const data = getPayloadRecord(payload);
  const providerReference = getString(data.providerReference);

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
}
