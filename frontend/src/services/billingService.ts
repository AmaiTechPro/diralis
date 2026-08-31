import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  version: number;
  description: string | null;
  monthlyPrice: number | null;
  annualPrice: number | null;
  currency: string;
  limits: Record<string, unknown>;
  features: Record<string, unknown>;
  active: boolean;
}

export interface UserSubscription {
  id: string;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "INCOMPLETE";
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
    limits: Record<string, unknown>;
    features: Record<string, unknown>;
  };
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

export async function getPlans(): Promise<{ plans: SubscriptionPlan[] }> {
  const response = await axios.get(`${API}/billing/plans`);
  return response.data;
}

export async function getBillingOverview(token: string): Promise<BillingOverview> {
  const response = await axios.get(`${API}/billing/overview`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function createCheckout(
  planId: string,
  interval: "MONTHLY" | "YEARLY",
  token: string
) {
  const response = await axios.post(
    `${API}/billing/checkout`,
    {
      planId,
      interval,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getSubscription(token: string) {
  const response = await axios.get(`${API}/billing/subscription`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function getEntitlements(token: string) {
  const response = await axios.get(`${API}/billing/entitlements`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function cancelSubscription(
  token: string,
  options?: { immediately?: boolean }
) {
  const response = await axios.post(
    `${API}/billing/cancel`,
    { immediately: options?.immediately ?? false },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function verifyPayment(reference: string) {
  const response = await axios.get(`${API}/billing/verify`, {
    params: {
      reference,
    },
  });

  return response.data;
}

export async function getBillingHistory(
  token: string
): Promise<{ history: BillingPayment[] }> {
  const response = await axios.get(`${API}/billing/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function getPaymentReceipt(token: string, paymentId: string) {
  const response = await axios.get(`${API}/billing/receipt/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

