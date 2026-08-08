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

export async function getAdminUsers() {
  return apiFetch<{
    users: AdminUser[];
  }>("/admin/users");
}

export async function getAdminMetrics() {
  return apiFetch<AdminMetrics>("/admin/metrics");
}

export async function getSecurityEvents() {
  return apiFetch<{
    events: SecurityEvent[];
  }>("/admin/security-events");
}

export async function getLockedAccounts() {
  return apiFetch<{
    users: AdminUser[];
  }>("/admin/locked-accounts");
}

export async function changeUserRole(
  id: string,
  role: string
) {
  return apiFetch(
    `/admin/users/${id}/role`,
    {
      method: "PATCH",

      body: JSON.stringify({
        role,
      }),
    }
  );
}

export async function toggleUserStatus(
  id: string
) {
  return apiFetch(
    `/admin/users/${id}/status`,
    {
      method: "PATCH",
    }
  );
}

export async function deleteUser(
  id: string
) {
  return apiFetch(
    `/admin/users/${id}`,
    {
      method: "DELETE",
    }
  );
}


