import prisma from "../../lib/prisma";
import { IntegrationConnection, SyncFrequency, SyncJob, SyncJobStatus, IntegrationStatus } from "@prisma/client";

export type FreshnessClassification =
  | "FRESH"
  | "SYNCING"
  | "STALE"
  | "ERROR"
  | "NEEDS_REAUTH"
  | "NEVER_SYNCED"
  | "DISABLED";

export interface FreshnessMetadata {
  connectionId: string;
  provider: string;
  name: string;
  status: IntegrationStatus;
  freshness: FreshnessClassification;
  syncInProgress: boolean;
  lastSuccessfulSyncAt: string | null;
  lastAttemptedAt: string | null;
  nextSyncAt: string | null;
  recordsLastSynced: number;
  retryCount: number;
  errorDetails: string | null;
  recentJobs?: {
    id: string;
    status: SyncJobStatus;
    recordsFetched: number;
    recordsAccepted: number;
    recordsDeduplicated: number;
    errorMessage: string | null;
    completedAt: string | null;
    createdAt: string;
  }[];
}

export class DataFreshnessService {
  /**
   * Evaluates freshness classification deterministically based on connection metadata and last job.
   */
  public static evaluateFreshness(
    connection: Pick<
      IntegrationConnection,
      | "status"
      | "syncInProgress"
      | "syncLeaseExpiresAt"
      | "lastSyncAt"
      | "lastAttemptedAt"
      | "nextSyncAt"
      | "syncFrequency"
      | "errorDetails"
    >,
    latestJob?: Pick<SyncJob, "status" | "completedAt"> | null,
    now: Date = new Date()
  ): FreshnessClassification {
    // 1. Inactive or disabled states
    // 1. Inactive or disabled states
    if (
      connection.status === IntegrationStatus.INACTIVE ||
      (connection.status as string) === "REVOKED" ||
      (connection.status as string) === "DISCONNECTED" ||
      (connection.status as string) === "PAUSED"
    ) {
      return "DISABLED";
    }

    // 2. Authentication failure requires re-auth
    if (
      connection.status === IntegrationStatus.NEEDS_REAUTH ||
      (connection.errorDetails && connection.errorDetails.toUpperCase().includes("AUTH"))
    ) {
      return "NEEDS_REAUTH";
    }

    // 3. Actively running sync (with valid lease)
    if (
      connection.syncInProgress &&
      connection.syncLeaseExpiresAt &&
      connection.syncLeaseExpiresAt.getTime() > now.getTime()
    ) {
      return "SYNCING";
    }

    // 4. Never synced
    if (!connection.lastSyncAt && (!latestJob || latestJob.status === "FAILED")) {
      if (connection.status === IntegrationStatus.ERROR || latestJob?.status === "FAILED") {
        return "ERROR";
      }
      return "NEVER_SYNCED";
    }

    // 5. Connection level error status
    if (connection.status === IntegrationStatus.ERROR) {
      return "ERROR";
    }

    // 6. Latest job failed and occurred after last successful sync
    if (
      latestJob &&
      latestJob.status === SyncJobStatus.FAILED &&
      (!connection.lastSyncAt || (latestJob.completedAt && latestJob.completedAt > connection.lastSyncAt))
    ) {
      return "ERROR";
    }

    // 7. Successful sync exists -> check staleness against frequency interval + grace period
    if (connection.lastSyncAt) {
      const elapsedMs = now.getTime() - connection.lastSyncAt.getTime();
      let thresholdMs: number;

      switch (connection.syncFrequency) {
        case "REALTIME":
          thresholdMs = 15 * 60 * 1000; // 15 min threshold
          break;
        case "HOURLY":
          thresholdMs = 75 * 60 * 1000; // 1 hour + 15 min grace
          break;
        case "DAILY":
        default:
          thresholdMs = 26 * 60 * 60 * 1000; // 24 hours + 2 hr grace
          break;
      }

      return elapsedMs <= thresholdMs ? "FRESH" : "STALE";
    }

    return "NEVER_SYNCED";
  }

  /**
   * Enriches a single connection with freshness status and sanitized metadata.
   */
  public static async getConnectionFreshness(
    userId: string,
    connectionId: string,
    includeHistory: boolean = false
  ): Promise<FreshnessMetadata | null> {
    const connection = await prisma.integrationConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
      include: {
        syncJobs: {
          orderBy: { createdAt: "desc" },
          take: includeHistory ? 5 : 1,
        },
      },
    });

    if (!connection) {
      return null;
    }

    const latestJob = connection.syncJobs[0] || null;
    const freshness = this.evaluateFreshness(connection, latestJob);

    return {
      connectionId: connection.id,
      provider: connection.providerId.toUpperCase(),
      name: connection.name,
      status: connection.status,
      freshness,
      syncInProgress: connection.syncInProgress,
      lastSuccessfulSyncAt: connection.lastSyncAt ? connection.lastSyncAt.toISOString() : null,
      lastAttemptedAt: connection.lastAttemptedAt ? connection.lastAttemptedAt.toISOString() : null,
      nextSyncAt: connection.nextSyncAt ? connection.nextSyncAt.toISOString() : null,
      recordsLastSynced: latestJob ? latestJob.recordsAccepted : 0,
      retryCount: connection.retryCount,
      errorDetails: this.sanitizeErrorMessage(connection.errorDetails || latestJob?.errorMessage || null),
      recentJobs: includeHistory
        ? connection.syncJobs.map((j) => ({
            id: j.id,
            status: j.status,
            recordsFetched: j.recordsFetched,
            recordsAccepted: j.recordsAccepted,
            recordsDeduplicated: j.recordsDeduplicated,
            errorMessage: this.sanitizeErrorMessage(j.errorMessage),
            completedAt: j.completedAt ? j.completedAt.toISOString() : null,
            createdAt: j.createdAt.toISOString(),
          }))
        : undefined,
    };
  }

  /**
   * Retrieves all connections for a user enriched with freshness classifications.
   */
  public static async listUserConnectionsFreshness(userId: string): Promise<FreshnessMetadata[]> {
    const connections = await prisma.integrationConnection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        syncJobs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return connections.map((conn) => {
      const latestJob = conn.syncJobs[0] || null;
      const freshness = this.evaluateFreshness(conn, latestJob);

      return {
        connectionId: conn.id,
        provider: conn.providerId.toUpperCase(),
        name: conn.name,
        status: conn.status,
        freshness,
        syncInProgress: conn.syncInProgress,
        lastSuccessfulSyncAt: conn.lastSyncAt ? conn.lastSyncAt.toISOString() : null,
        lastAttemptedAt: conn.lastAttemptedAt ? conn.lastAttemptedAt.toISOString() : null,
        nextSyncAt: conn.nextSyncAt ? conn.nextSyncAt.toISOString() : null,
        recordsLastSynced: latestJob ? latestJob.recordsAccepted : 0,
        retryCount: conn.retryCount,
        errorDetails: this.sanitizeErrorMessage(conn.errorDetails || latestJob?.errorMessage || null),
      };
    });
  }

  /**
   * Transforms raw technical errors into safe, customer-facing explanations.
   * Prevents leaking stack traces, tokens, or internal database metadata.
   */
  public static sanitizeErrorMessage(rawError: string | null): string | null {
    if (!rawError) return null;
    const normalized = rawError.toUpperCase();

    if (normalized.includes("RATE_LIMITED") || normalized.includes("THROTTLED") || normalized.includes("429")) {
      return "Integration provider temporarily limited requests. Synchronization will retry automatically.";
    }
    if (
      normalized.includes("AUTHENTICATION_FAILURE") ||
      normalized.includes("UNAUTHORIZED") ||
      normalized.includes("AUTH_REQUIRED") ||
      normalized.includes("INVALID_CREDENTIALS")
    ) {
      return "Store authorization is no longer valid. Please reconnect your store.";
    }
    if (normalized.includes("TIMEOUT") || normalized.includes("ETIMEDOUT") || normalized.includes("ECONNRESET")) {
      return "Connection timed out reaching provider. Synchronization will retry.";
    }
    if (normalized.includes("PLAN_NOT_ENTITLED")) {
      return "Integration feature requires an upgraded subscription plan.";
    }
    if (normalized.includes("SCHEMA_FAILURE") || normalized.includes("VALIDATION")) {
      return "Data format could not be normalized. Synchronization requires attention.";
    }

    return "Synchronization encountered an issue. Diralis will retry on the next cycle.";
  }
}



