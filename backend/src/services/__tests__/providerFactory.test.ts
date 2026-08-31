import { describe, it, expect } from "vitest";
import { BillingProvider } from "@prisma/client";
import { getPaymentProvider } from "../billing/providerFactory";

describe("Payment Provider Factory", () => {
  it("should instantiate correct provider based on enum", () => {
    const paystack = getPaymentProvider(BillingProvider.PAYSTACK);
    expect(paystack.name).toBe(BillingProvider.PAYSTACK);

    const stripe = getPaymentProvider(BillingProvider.STRIPE);
    expect(stripe.name).toBe(BillingProvider.STRIPE);

    const paypal = getPaymentProvider(BillingProvider.PAYPAL);
    expect(paypal.name).toBe(BillingProvider.PAYPAL);

    const flutterwave = getPaymentProvider(BillingProvider.FLUTTERWAVE);
    expect(flutterwave.name).toBe(BillingProvider.FLUTTERWAVE);
  });
});


