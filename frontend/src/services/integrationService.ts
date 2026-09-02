import { apiFetch } from "../api/client";

export type FreshnessClassification =
  | "FRESH"
  | "SYNCING"
  | "STALE"
  | "ERROR"
  | "NEEDS_REAUTH"
  | "NEVER_SYNCED"
  | "DISABLED";

export interface SyncJobHistoryItem {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PARTIAL";
  recordsFetched: number;
  recordsAccepted: number;
  recordsDeduplicated: number;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ConnectionFreshness {
  connectionId: string;
  provider: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ERROR" | "NEEDS_REAUTH" | "REVOKED";
  freshness: FreshnessClassification;
  syncInProgress: boolean;
  lastSuccessfulSyncAt: string | null;
  lastAttemptedAt: string | null;
  nextSyncAt: string | null;
  recordsLastSynced: number;
  retryCount: number;
  errorDetails: string | null;
  recentJobs?: SyncJobHistoryItem[];
}

export async function listIntegrationsFreshness(): Promise<ConnectionFreshness[]> {
  const data = await apiFetch<{ connections: ConnectionFreshness[] }>("/integrations/freshness");
  return data.connections;
}

export async function getIntegrationFreshness(connectionId: string): Promise<ConnectionFreshness> {
  const data = await apiFetch<{ freshness: ConnectionFreshness }>(`/integrations/${connectionId}/freshness`);
  return data.freshness;
}

export async function getShopifyConnectUrl(shop: string): Promise<{ authorizationUrl: string; state: string }> {
  return await apiFetch<{ authorizationUrl: string; state: string }>(
    `/integrations/shopify/connect?shop=${encodeURIComponent(shop)}`
  );
}

export async function triggerManualSync(
  connectionId: string,
  entityName: "transactions" | "inventory" = "transactions"
): Promise<{ success: boolean; result: any }> {
  return await apiFetch<{ success: boolean; result: any }>(`/api/integrations/${connectionId}/sync`, {
    method: "POST",
    body: JSON.stringify({ entityName }),
  });
}

export async function disconnectIntegration(connectionId: string): Promise<{ success: boolean; message: string }> {
  return await apiFetch<{ success: boolean; message: string }>(`/api/integrations/${connectionId}`, {
    method: "DELETE",
  });
}



