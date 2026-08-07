import { BillingProvider } from "@prisma/client";
import prisma from "../../lib/prisma";
import { getPrimaryBillingProvider } from "./providerConfigService";
import { getPaymentProvider } from "./providerFactory";

type BillingInterval = "MONTHLY" | "YEARLY";

export async function createCheckout(
  userId: string,
  planId: string,
  interval: BillingInterval
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: {
      id: planId,
    },
  });

  if (!plan || !plan.active) {
    throw new Error("Subscription plan is not available.");
  }

  if (plan.code === "FREE") {
    throw new Error(
      "The FREE plan does not require checkout."
    );
  }

  const amount =
    interval === "MONTHLY"
      ? plan.monthlyPrice
      : plan.annualPrice;

  if (amount === null || amount === undefined) {
    throw new Error(
      `The ${plan.name} plan does not currently have a ${interval.toLowerCase()} price configured.`
    );
  }

  if (amount <= 0) {
    throw new Error(
      "A paid checkout requires a valid positive amount."
    );
  }

  const billingProvider =
    await getPrimaryBillingProvider();

  const providerName =
    billingProvider.provider as BillingProvider;

  const provider =
    getPaymentProvider(providerName);

  const callbackUrl =
    process.env.BILLING_CALLBACK_URL ||
    `${process.env.FRONTEND_URL}/billing/verify`;
  

   const subscription =
  await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: "INCOMPLETE",
      provider: providerName,
      interval,
    },
  });
  


  const checkout =
    await provider.createCheckout({
      userId,
      subscriptionId: subscription.id,
      planId,
      interval,
      email: user.email,
      amount,
      currency: plan.currency,
      callbackUrl,
    });

  await prisma.payment.create({
  data: {
    userId,
    subscriptionId: subscription.id,
    provider: providerName,
    providerReference:
      checkout.providerReference,
    amount,
    currency: plan.currency,
    status: "PENDING",
  },
});


  return {
    checkoutUrl: checkout.checkoutUrl,
    providerReference:
      checkout.providerReference,
    provider: billingProvider.provider,
    plan: {
      id: plan.id,
      code: plan.code,
      name: plan.name,
    },
    interval,
    amount,
    currency: plan.currency,
  };
}

