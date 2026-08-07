import { BillingProvider } from "@prisma/client";

import {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutResult,
  PaymentVerificationResult,
  PaymentWebhookResult,
} from "./paymentProvider";


export class StripeProvider implements PaymentProvider {

  readonly name = BillingProvider.STRIPE;


  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CheckoutResult> {

    throw new Error(
      "Stripe checkout implementation ready for API credentials."
    );

  }


  async verifyPayment(
    reference: string
  ): Promise<PaymentVerificationResult> {

    throw new Error(
      "Stripe payment verification implementation ready."
    );

  }


  verifyWebhook(
    signature: string,
    rawBody: string
  ): boolean {

    return false;

  }


  normalizeWebhook(
    payload: unknown
  ): PaymentWebhookResult {

    throw new Error(
      "Stripe webhook normalization not implemented."
    );

  }


  async cancelSubscription(
    providerSubscriptionId: string
  ): Promise<boolean> {

    throw new Error(
      "Stripe subscription cancellation implementation ready."
    );

  }

}


