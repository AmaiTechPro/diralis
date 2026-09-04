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
  twoFactorEnabled?: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLogin: string | null;
  picture: string | null;
  _count?: {
    securityEvents: number;
  };
}

export interface AdminMetrics {
  users: {
    total: number;
    verified: number;
    twoFactorAdoption?: number;
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
    recentFailedLogins?: number;
    totalPasskeys?: number;
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
  device: string | null;
  country: string | null;
  city: string | null;
  details: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    picture?: string | null;
    status?: string;
  } | null;
}

export interface SecurityTelemetryMetrics {
  totalPasskeys: number;
  failedLogins24h: number;
  lockedAccounts: number;
  eventsByAction: Array<{ action: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
}

export interface SecurityEventsResponse {
  events: SecurityEvent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface UserPasskeyAdmin {
  id: string;
  name: string;
  deviceType: string;
  backedUp: boolean;
  lastUsedAt: string | null;
  createdAt: string;
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

// =========================
// API Calls
// =========================

export async function getAdminUsers() {
  return apiFetch<{ users: AdminUser[] }>("/admin/users");
}

export async function getAdminMetrics() {
  return apiFetch<AdminMetrics>("/admin/metrics");
}

export async function getSecurityTelemetryMetrics() {
  return apiFetch<SecurityTelemetryMetrics>("/admin/security/metrics");
}

export async function getSecurityEvents(params?: {
  page?: number;
  limit?: number;
  action?: string;
  country?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.action && params.action !== "ALL") query.set("action", params.action);
  if (params?.country && params.country !== "ALL") query.set("country", params.country);
  if (params?.search) query.set("search", params.search);

  const qs = query.toString();
  return apiFetch<SecurityEventsResponse>(`/admin/security/events${qs ? `?${qs}` : ""}`);
}

export async function getLockedAccounts() {
  return apiFetch<{ users: AdminUser[] }>("/admin/locked-accounts");
}

export async function unlockUserAccount(id: string) {
  return apiFetch<{ message: string; user: AdminUser }>(`/admin/users/${id}/unlock`, {
    method: "POST",
  });
}

export async function getUserPasskeysAdmin(userId: string) {
  return apiFetch<{ passkeys: UserPasskeyAdmin[] }>(`/admin/users/${userId}/passkeys`);
}

export async function revokeUserPasskeyAdmin(passkeyId: string) {
  return apiFetch<{ message: string }>(`/admin/passkeys/${passkeyId}`, {
    method: "DELETE",
  });
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




