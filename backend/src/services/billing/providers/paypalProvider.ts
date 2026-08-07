import { BillingProvider } from "@prisma/client";

import {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutResult,
  PaymentVerificationResult,
  PaymentWebhookResult,
} from "./paymentProvider";


export class PaypalProvider implements PaymentProvider {

  readonly name = BillingProvider.PAYPAL;


  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CheckoutResult> {

    throw new Error(
      "PayPal checkout implementation ready for API credentials."
    );

  }


  async verifyPayment(
    reference: string
  ): Promise<PaymentVerificationResult> {

    throw new Error(
      "PayPal payment verification implementation ready."
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
      "PayPal webhook normalization not implemented."
    );

  }


  async cancelSubscription(
    providerSubscriptionId: string
  ): Promise<boolean> {

    throw new Error(
      "PayPal subscription cancellation implementation ready."
    );

  }

}


