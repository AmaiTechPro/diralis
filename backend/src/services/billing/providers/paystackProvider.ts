import crypto from "crypto";
import { BillingProvider } from "@prisma/client";
import {
  CreateCheckoutInput,
  PaymentProvider,
  PaymentWebhookResult,
} from "./paymentProvider";

export class PaystackProvider implements PaymentProvider {
  readonly name = BillingProvider.PAYSTACK;

  private getSecretKey(): string {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
      throw new Error("Paystack secret key is missing.");
    }
    return key;
  }

  /**
   * Resolves currency and amount for Paystack merchant accounts.
   * If the account requires KES, it converts USD pricing at standard benchmark rate for sandbox.
   */
  private resolvePaystackBilling(requestedCurrency?: string, rawAmount: number = 0) {
    const forcedCurrency = process.env.PAYSTACK_CURRENCY?.toUpperCase() || "KES";

    // If merchant currency is KES and plan is in USD (e.g. $79.00 = 7900 cents)
    if (forcedCurrency === "KES" && (!requestedCurrency || requestedCurrency.toUpperCase() === "USD")) {
      const usdDollars = rawAmount / 100; // e.g. 79
      const kesRate = 130; // Benchmark rate for sandbox checkout
      const amountInKesCents = Math.round(usdDollars * kesRate * 100);
      return {
        currency: "KES",
        amount: amountInKesCents,
      };
    }

    return {
      currency: forcedCurrency,
      amount: rawAmount,
    };
  }

  async createCheckout(input: CreateCheckoutInput) {
    const secretKey = this.getSecretKey();
    const { currency, amount } = this.resolvePaystackBilling(input.currency, input.amount);
    const reference = `${input.userId}-${Date.now()}`;

    const payload = {
      email: input.email,
      amount,
      currency,
      reference,
      callback_url: input.callbackUrl,
      metadata: {
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        planId: input.planId,
        interval: input.interval,
        originalCurrency: input.currency,
        originalAmount: input.amount,
      },
    };

    console.log("💳 Paystack Initialize Payload:", {
      email: payload.email,
      amount: payload.amount,
      currency: payload.currency,
      reference: payload.reference,
    });

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await response.json()) as any;

    console.log("💳 Paystack Initialize Response:", data);

    if (!response.ok || !data.status || !data.data) {
      throw new Error(
        data.message || "Failed to initialize Paystack checkout."
      );
    }

    return {
      checkoutUrl: data.data.authorization_url,
      providerReference: data.data.reference,
    };
  }

  async verifyPayment(reference: string) {
    const secretKey = this.getSecretKey();

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = (await response.json()) as any;

    if (!response.ok || !data.status || !data.data) {
      throw new Error(
        data.message || "Failed to verify payment."
      );
    }

    const payment = data.data;

    return {
      successful: payment.status === "success",
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      metadata: payment.metadata,
    };
  }

  verifyWebhook(signature: string, rawBody: string): boolean {
    if (!signature || !rawBody) {
      return false;
    }

    const secretKey = this.getSecretKey();

    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    return hash === signature;
  }

  normalizeWebhook(payload: unknown): PaymentWebhookResult {
    const data = payload as any;
    const metadata = data?.data?.metadata ?? {};
    const providerReference = data?.data?.reference;

    return {
      eventId:
        data?.data?.id?.toString() ??
        providerReference ??
        crypto.randomUUID(),
      eventType:
        data?.event === "charge.success"
          ? "PAYMENT_SUCCESS"
          : data?.event ?? "UNKNOWN",
      reference: providerReference,
      successful: data?.event === "charge.success",
      amount: data?.data?.amount,
      currency: data?.data?.currency,
      userId: metadata.userId,
      subscriptionId: metadata.subscriptionId,
      interval: metadata.interval,
      metadata: {
        ...metadata,
        providerReference,
        provider: BillingProvider.PAYSTACK,
      },
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<boolean> {
    const secretKey = this.getSecretKey();

    const response = await fetch(
      "https://api.paystack.co/subscription/disable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: providerSubscriptionId,
          token: providerSubscriptionId,
        }),
      }
    );

    const data = (await response.json()) as any;

    if (!response.ok || !data.status) {
      throw new Error(
        data.message || "Failed to cancel subscription."
      );
    }

    return true;
  }
}


