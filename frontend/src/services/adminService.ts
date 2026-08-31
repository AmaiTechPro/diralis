import { apiFetch } from "../api/client";

export interface AdminUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: string;
  provider: string;
  createdAt: string;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLogin: string | null;
  picture: string | null;
}

export interface AdminMetrics {
  users: {
    total: number;
    verified: number;
  };
  datasets: {
    total: number;
  };
  chat: {
    sessions: number;
    messages: number;
  };
  sessions: {
    total: number;
    active: number;
  };
  security: {
    events: number;
    lockedAccounts: number;
  };
  billing: {
    subscriptionPlans: {
      total: number;
      active: number;
    };
    subscriptions: {
      total: number;
      active: number;
      trialing: number;
    };
    payments: {
      total: number;
      successful: number;
      pending: number;
      failed: number;
    };
    webhooks: {
      total: number;
      processed: number;
      unprocessed: number;
    };
    providers: {
      total: number;
      enabled: number;
    };
  };
  totalUsers: number;
  verifiedUsers: number;
  totalDatasets: number;
  securityEvents: number;
  lockedAccounts: number;
  activeSessions: number;
  chatSessions: number;
}

export interface SecurityEvent {
  id: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
  } | null;
}

export interface AdminSubscription {
  id: string;
  userId: string;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "INCOMPLETE";
  provider: string | null;
  interval: "MONTHLY" | "YEARLY" | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
  };
  plan: {
    id: string;
    code: string;
    name: string;
    monthlyPrice: number | null;
    annualPrice: number | null;
    currency: string;
  };
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt: string | null;
    providerReference: string;
  }>;
}

export interface AdminPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerReference: string;
  paidAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
  };
  subscription: {
    id: string;
    plan: {
      id: string;
      code: string;
      name: string;
    };
  } | null;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  activeSubscribers: number;
  totalCollected: number;
  totalTransactions: number;
  currency: string;
}

export async function getAdminUsers() {
  return apiFetch<{ users: AdminUser[] }>("/admin/users");
}

export async function getAdminMetrics() {
  return apiFetch<AdminMetrics>("/admin/metrics");
}

export async function getSecurityEvents() {
  return apiFetch<{ events: SecurityEvent[] }>("/admin/security-events");
}

export async function getLockedAccounts() {
  return apiFetch<{ users: AdminUser[] }>("/admin/locked-accounts");
}

export async function getAdminSubscriptions(status?: string) {
  const query = status && status !== "ALL" ? `?status=${status}` : "";
  return apiFetch<{ subscriptions: AdminSubscription[] }>(`/admin/subscriptions${query}`);
}

export async function getAdminPayments() {
  return apiFetch<{ payments: AdminPayment[] }>("/admin/payments");
}

export async function getAdminRevenueMetrics() {
  return apiFetch<RevenueMetrics>("/admin/revenue");
}

export async function adminOverrideSubscription(
  subscriptionId: string,
  data: {
    planId?: string;
    status?: string;
    extendDays?: number;
    cancelAtPeriodEnd?: boolean;
  }
) {
  return apiFetch<{ subscription: AdminSubscription }>(
    `/admin/subscriptions/${subscriptionId}/override`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function changeUserRole(id: string, role: string) {
  return apiFetch(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function toggleUserStatus(id: string) {
  return apiFetch(`/admin/users/${id}/status`, {
    method: "PATCH",
  });
}

export async function deleteUser(id: string) {
  return apiFetch(`/admin/users/${id}`, {
    method: "DELETE",
  });
}


