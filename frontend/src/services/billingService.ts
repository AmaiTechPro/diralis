import api from "./api";

export interface PlanLimits {
  datasets?: number;
  maxFileSizeMb?: number;
  storageMb?: number;
  monthlyExports?: number;
  aiRequestsPerMonth?: number;
  forecastsPerMonth?: number;
  teamMembers?: number;
  [key: string]: unknown;
}

export interface PlanFeatures {
  datasetProfiling?: boolean;
  exportCsv?: boolean;
  exportJson?: boolean;
  exportPdf?: boolean;
  exportExcel?: boolean;
  aiChat?: boolean;
  analytics?: boolean;
  advancedAnalytics?: boolean;
  forecasting?: boolean;
  anomalyDetection?: boolean;
  customVisualizations?: boolean;
  apiAccess?: boolean;
  teamCollaboration?: boolean;
  prioritySupport?: boolean;
  [key: string]: unknown;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  version: number;
  description: string | null;
  monthlyPrice: number | null;
  annualPrice: number | null;
  currency: string;
  limits: PlanLimits;
  features: PlanFeatures;
  active: boolean;
}

export interface UserSubscription {
  id: string;
  status:
    | "ACTIVE"
    | "TRIALING"
    | "PAST_DUE"
    | "CANCELLED"
    | "EXPIRED"
    | "INCOMPLETE";
  interval: "MONTHLY" | "YEARLY";
  provider: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
}

export interface BillingOverview {
  hasActiveSubscription: boolean;
  subscription: UserSubscription | null;
  plan: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    currency: string;
    monthlyPrice: number | null;
    annualPrice: number | null;
  } | null;
  entitlements: {
    limits: PlanLimits;
    features: PlanFeatures;
  };
}

export interface CheckoutResponse {
  checkoutUrl?: string;
  authorizationUrl?: string;
  reference?: string;
  accessCode?: string;
  subscriptionId?: string;
  [key: string]: unknown;
}

export interface BillingPayment {
  id: string;
  provider: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  subscription: {
    id: string;
    status: string;
    interval: "MONTHLY" | "YEARLY";
    plan: {
      id: string;
      code: string;
      name: string;
    };
  } | null;
}

export interface PaymentReceipt {
  payment: {
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
  };
  user: {
    fullName: string;
    email: string;
  };
  plan: {
    name: string;
    code: string;
  } | null;
}

/* -------------------------------------------------- */
/* API Calls                                          */
/* -------------------------------------------------- */

export async function getPlans(): Promise<{ plans: SubscriptionPlan[] }> {
  const response = await api.get<{ plans: SubscriptionPlan[] }>("/billing/plans");
  return response.data;
}

export async function getBillingOverview(): Promise<BillingOverview> {
  const response = await api.get<BillingOverview>("/billing/overview");
  return response.data;
}

export async function getSubscription(): Promise<{ subscription: UserSubscription | null }> {
  const response = await api.get<{ subscription: UserSubscription | null }>(
    "/billing/subscription"
  );
  return response.data;
}

export async function getEntitlements(): Promise<{
  plan: { id: string; code: string; name: string };
  limits: PlanLimits;
  features: PlanFeatures;
}> {
  const response = await api.get<{
    plan: { id: string; code: string; name: string };
    limits: PlanLimits;
    features: PlanFeatures;
  }>("/billing/entitlements");
  return response.data;
}

export async function createCheckout(
  planId: string,
  interval: "MONTHLY" | "YEARLY"
): Promise<CheckoutResponse> {
  const response = await api.post<CheckoutResponse>("/billing/checkout", {
    planId,
    interval,
  });
  return response.data;
}

export async function verifyPayment(
  reference: string
): Promise<{ success: boolean; message?: string; [key: string]: unknown }> {
  const response = await api.get<{
    success: boolean;
    message?: string;
    [key: string]: unknown;
  }>("/billing/verify", {
    params: { reference },
  });
  return response.data;
}

export async function cancelSubscription(options?: {
  immediately?: boolean;
}): Promise<{ success: boolean; message: string }> {
  const response = await api.post<{ success: boolean; message: string }>(
    "/billing/cancel",
    { immediately: options?.immediately ?? false }
  );
  return response.data;
}

export async function getBillingHistory(): Promise<{
  history: BillingPayment[];
}> {
  const response = await api.get<{ history: BillingPayment[] }>(
    "/billing/history"
  );
  return response.data;
}

export async function getPaymentReceipt(
  paymentId: string
): Promise<PaymentReceipt> {
  const response = await api.get<PaymentReceipt>(
    `/billing/receipt/${paymentId}`
  );
  return response.data;
}


