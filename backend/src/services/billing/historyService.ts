import prisma from "../../lib/prisma";

export async function getBillingHistory(userId: string) {
  const payments = await prisma.payment.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  return payments.map((payment) => ({
    id: payment.id,
    provider: payment.provider,
    reference: payment.providerReference,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    subscription: payment.subscription
      ? {
          id: payment.subscription.id,
          status: payment.subscription.status,
          interval: payment.subscription.interval,
          plan: {
            id: payment.subscription.plan.id,
            code: payment.subscription.plan.code,
            name: payment.subscription.plan.name,
          },
        }
      : null,
  }));
}

export async function getPaymentReceipt(userId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
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

  return {
    id: payment.id,
    provider: payment.provider,
    reference: payment.providerReference,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    subscription: payment.subscription
      ? {
          id: payment.subscription.id,
          status: payment.subscription.status,
          interval: payment.subscription.interval,
          currentPeriodStart: payment.subscription.currentPeriodStart,
          currentPeriodEnd: payment.subscription.currentPeriodEnd,
          plan: {
            id: payment.subscription.plan.id,
            code: payment.subscription.plan.code,
            name: payment.subscription.plan.name,
            description: payment.subscription.plan.description,
          },
        }
      : null,
  };
}

