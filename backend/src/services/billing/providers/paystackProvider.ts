import crypto from "crypto";

import {
  BillingProvider,
} from "@prisma/client";

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
      throw new Error(
        "Paystack secret key is missing."
      );
    }

    return key;
  }



  async createCheckout(
    input: CreateCheckoutInput
  ) {

    const secretKey = this.getSecretKey();


    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${secretKey}`,

          "Content-Type":
            "application/json",
        },


        body: JSON.stringify({

          email: input.email,

          amount: input.amount,

          currency: input.currency,

          reference:
            `${input.userId}-${Date.now()}`,

          callback_url:
            input.callbackUrl,


          metadata: {

            userId:
              input.userId,

            subscriptionId:
              input.subscriptionId,

            planId:
              input.planId,

            interval:
              input.interval,

          },

        }),
      }
    );


    const data =
      await response.json() as any;



    if (
      !response.ok ||
      !data.status ||
      !data.data
    ) {

      throw new Error(
        data.message ||
        "Failed to initialize Paystack checkout."
      );

    }


    return {

      checkoutUrl:
        data.data.authorization_url,


      providerReference:
        data.data.reference,

    };

  }





  async verifyPayment(
    reference: string
  ) {


    const secretKey =
      this.getSecretKey();


    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,

      {

        method: "GET",

        headers: {

          Authorization:
            `Bearer ${secretKey}`,

        },

      }
    );


    const data =
      await response.json() as any;



    if (
      !response.ok ||
      !data.status ||
      !data.data
    ) {

      throw new Error(
        data.message ||
        "Failed to verify payment."
      );

    }



    const payment =
      data.data;



    return {

      successful:
        payment.status === "success",


      reference:
        payment.reference,


      amount:
        payment.amount,


      currency:
        payment.currency,


      metadata:
        payment.metadata,


    };

  }





  verifyWebhook(
    signature: string,
    rawBody: string
  ): boolean {


    if (
      !signature ||
      !rawBody
    ) {

      return false;

    }


    const secretKey =
      this.getSecretKey();



    const hash =
      crypto
        .createHmac(
          "sha512",
          secretKey
        )
        .update(rawBody)
        .digest("hex");



    return hash === signature;

  }





   normalizeWebhook(
  payload: unknown
): PaymentWebhookResult {

  const data = payload as any;

  const metadata =
    data?.data?.metadata ?? {};

  const providerReference =
    data?.data?.reference;

  return {
    eventId:
      data?.data?.id?.toString()
      ?? providerReference
      ?? crypto.randomUUID(),

    eventType:
      data?.event === "charge.success"
        ? "PAYMENT_SUCCESS"
        : data?.event ?? "UNKNOWN",

    reference:
      providerReference,

    successful:
      data?.event === "charge.success",

    amount:
      data?.data?.amount,

    currency:
      data?.data?.currency,

    userId:
      metadata.userId,

    subscriptionId:
      metadata.subscriptionId,

    interval:
      metadata.interval,

    metadata: {
      ...metadata,

      providerReference,

      provider:
        BillingProvider.PAYSTACK,
    },
  };
}




  async cancelSubscription(
    providerSubscriptionId: string
  ): Promise<boolean> {


    const secretKey =
      this.getSecretKey();



    const response = await fetch(

      "https://api.paystack.co/subscription/disable",

      {

        method:
          "POST",


        headers: {

          Authorization:
            `Bearer ${secretKey}`,

          "Content-Type":
            "application/json",

        },


        body: JSON.stringify({

          code:
            providerSubscriptionId,

          token:
            providerSubscriptionId,

        }),

      }

    );


    const data =
      await response.json() as any;



    if (
      !response.ok ||
      !data.status
    ) {

      throw new Error(
        data.message ||
        "Failed to cancel subscription."
      );

    }


    return true;

  }

}

