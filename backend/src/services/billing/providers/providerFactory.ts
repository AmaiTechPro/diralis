import { BillingProvider } from "@prisma/client";

import { PaymentProvider } from "./paymentProvider";

import { PaystackProvider } from "./paystackProvider";
import { PaypalProvider } from "./paypalProvider";
import { FlutterwaveProvider } from "./flutterwaveProvider";
import { StripeProvider } from "./stripeProvider";


export function getPaymentProvider(
  provider: BillingProvider
): PaymentProvider {

  switch (provider) {

    case BillingProvider.PAYSTACK:

      return new PaystackProvider();


    case BillingProvider.PAYPAL:

      return new PaypalProvider();


    case BillingProvider.FLUTTERWAVE:

      return new FlutterwaveProvider();


    case BillingProvider.STRIPE:

      return new StripeProvider();


    case BillingProvider.OTHER:

      throw new Error(
        "OTHER billing provider requires a custom adapter."
      );


    default:

      throw new Error(
        `Unsupported billing provider: ${provider}`
      );

  }

}

