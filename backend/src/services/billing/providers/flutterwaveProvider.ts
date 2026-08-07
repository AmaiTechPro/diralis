import { BillingProvider } from "@prisma/client";

import {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutResult,
  PaymentVerificationResult,
  PaymentWebhookResult,
} from "./paymentProvider";


export class FlutterwaveProvider implements PaymentProvider {

  readonly name = BillingProvider.FLUTTERWAVE;


  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CheckoutResult> {

    throw new Error(
      "Flutterwave checkout implementation ready for API credentials."
    );

  }


  async verifyPayment(
    reference: string
  ): Promise<PaymentVerificationResult> {

    throw new Error(
      "Flutterwave payment verification implementation ready."
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
      "Flutterwave webhook normalization not implemented."
    );

  }


  async cancelSubscription(
    providerSubscriptionId: string
  ): Promise<boolean> {

    throw new Error(
      "Flutterwave subscription cancellation implementation ready."
    );

  }

}


