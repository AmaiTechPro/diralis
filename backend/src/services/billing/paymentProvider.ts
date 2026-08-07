export type BillingInterval = "MONTHLY" | "YEARLY";

export interface PaymentCheckoutRequest {
   subscriptionId: string;
  userId: string;
  planId: string;
  interval: BillingInterval;
  email: string;
  amount: number;
  currency: string;
  callbackUrl: string;
}

export interface PaymentCheckoutResponse {
  checkoutUrl: string;
  providerReference: string;
  providerCustomerId?: string;
}

export interface PaymentVerificationResult {
  successful: boolean;
  reference: string;
  amount?: number;
  currency?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentWebhookResult {
  eventId: string;
  eventType: string;
  reference?: string;
  successful: boolean;
  amount?: number;
  currency?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  createCheckout(
    request: PaymentCheckoutRequest
  ): Promise<PaymentCheckoutResponse>;

  verifyPayment(
    reference: string
  ): Promise<PaymentVerificationResult>;

  handleWebhook(
    payload: unknown,
    signature: string
  ): Promise<PaymentWebhookResult>;

  cancelSubscription(
    providerSubscriptionId: string
  ): Promise<boolean>;

  normalizeWebhook(
 payload: unknown
): PaymentWebhookResult;
}


