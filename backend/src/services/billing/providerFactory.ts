import { BillingProvider } from "@prisma/client";

import { PaymentProvider } from "./providers/paymentProvider";

import { PaystackProvider } from "./providers/paystackProvider";
import { PaypalProvider } from "./providers/paypalProvider";
import { FlutterwaveProvider } from "./providers/flutterwaveProvider";
import { StripeProvider } from "./providers/stripeProvider";


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


    default:
      throw new Error(
        `Unsupported billing provider: ${provider}`
      );

  }

}


