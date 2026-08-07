import {
  BillingProvider,
  BillingInterval,
} from "@prisma/client";


export interface CreateCheckoutInput {
  userId: string;
  subscriptionId: string;
  planId: string;
  interval: BillingInterval;
  email: string;
  amount: number;
  currency: string;
  callbackUrl: string;
}


export interface CheckoutResult {
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

  userId?: string;
  subscriptionId?: string;

  providerCustomerId?: string;
  providerSubscriptionId?: string;

  interval?: BillingInterval;

  metadata?: Record<string, unknown>;
}


export interface PaymentProvider {

  /**
   * Identifies the payment gateway
   */
  readonly name: BillingProvider;


  /**
   * Creates payment checkout session
   */
  createCheckout(
    input: CreateCheckoutInput
  ): Promise<CheckoutResult>;


  /**
   * Verifies payment directly with provider API
   */
  verifyPayment(
    reference: string
  ): Promise<PaymentVerificationResult>;


  /**
   * Validates webhook authenticity
   */
  verifyWebhook(
    signature: string,
    rawBody: string
  ): boolean;


  /**
   * Converts provider-specific webhook
   * payload into Diralis format
   */
  normalizeWebhook(
    payload: unknown
  ): PaymentWebhookResult;


  /**
   * Cancels recurring subscription
   */
  cancelSubscription(
    providerSubscriptionId: string
  ): Promise<boolean>;

}

