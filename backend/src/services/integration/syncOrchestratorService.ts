import prisma from "../../lib/prisma";
import { IngestionPipeline, IngestionResult } from "./ingestionPipeline";
import { EntitlementService } from "../entitlementService";
import { CopilotLogger } from "../copilot/copilotLogger";
import { IntegrationStatus, SyncFrequency, SyncJobStatus } from "@prisma/client";

export const LEASE_DURATION_MS = 10 * 60 * 1000; // 10 minutes lease timeout
export const MAX_RETRY_ATTEMPTS = 3;
export const BASE_BACKOFF_MS = 60 * 1000; // 1 minute base backoff

export interface OrchestrationResult {
  connectionId: string;
  jobId?: string;
  status: "COMPLETED" | "FAILED" | "SKIPPED_IN_PROGRESS" | "SKIPPED_UNENTITLED";
  recordsFetched?: number;
  recordsAccepted?: number;
  recordsDeduplicated?: number;
  error?: string;
  nextSyncAt?: Date | null;
}

export class SyncOrchestratorService {
  /**
   * Calculates next scheduled execution based on frequency.
   */
  public static calculateNextSync(frequency: SyncFrequency, fromDate: Date = new Date()): Date | null {
    const next = new Date(fromDate);
    switch (frequency) {
      case "HOURLY":
        next.setHours(next.getHours() + 1);
        return next;
      case "DAILY":
        next.setDate(next.getDate() + 1);
        return next;
      case "REALTIME":
        next.setMinutes(next.getMinutes() + 5); // 5-minute polling fallback for polling connectors
        return next;
      case "MANUAL":
      default:
        return null;
    }
  }

  /**
   * Calculates bounded exponential backoff.
   */
  public static calculateBackoff(retryCount: number, fromDate: Date = new Date()): Date {
    const backoffMs = Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount), 60 * 60 * 1000); // capped at 1 hr
    return new Date(fromDate.getTime() + backoffMs);
  }

  /**
   * Determines if an error is permanent or transient.
   */
  public static isPermanentFailure(errorMessage: string): boolean {
    const normalized = errorMessage.toUpperCase();
    return (
      normalized.includes("UNAUTHORIZED") ||
      normalized.includes("AUTH_REQUIRED") ||
      normalized.includes("PLAN_NOT_ENTITLED") ||
      normalized.includes("INVALID_CREDENTIALS") ||
      normalized.includes("FORBIDDEN") ||
      normalized.includes("NOT_FOUND") ||
      normalized.includes("UNSUPPORTED_PROVIDER")
    );
  }

  /**
   * Recovers any stale connections that crashed mid-execution.
   */
  public static async recoverStaleLeases(): Promise<number> {
    const now = new Date();
    const staleConnections = await prisma.integrationConnection.findMany({
      where: {
        syncInProgress: true,
        syncLeaseExpiresAt: { lt: now },
      },
      select: { id: true, userId: true },
    });

    for (const conn of staleConnections) {
      // Mark any RUNNING SyncJob as FAILED
      await prisma.syncJob.updateMany({
        where: {
          connectionId: conn.id,
          status: SyncJobStatus.RUNNING,
        },
        data: {
          status: SyncJobStatus.FAILED,
          errorMessage: "STALE_LOCK_TIMEOUT: Worker lease expired",
          completedAt: now,
        },
      });

      // Release the lease
      await prisma.integrationConnection.update({
        where: { id: conn.id },
        data: {
          syncInProgress: false,
          syncLeaseExpiresAt: null,
          errorDetails: "Previous synchronization timed out or worker crashed.",
        },
      });

      CopilotLogger.log(
        "DETERMINISTIC_TOOL_EXECUTED",
        { connectionId: conn.id, userId: conn.userId },
        { action: "STALE_SYNC_RECOVERED" },
        undefined,
        "WARN"
      );
    }

    return staleConnections.length;
  }

  /**
   * Atomically claims a connection for synchronization.
   * Returns true if claim was acquired; false if already locked.
   */
  public static async claimConnection(connectionId: string): Promise<boolean> {
    const now = new Date();
    const leaseExpires = new Date(now.getTime() + LEASE_DURATION_MS);

    // Atomic update: only claim if syncInProgress is false OR existing lease expired
    const result = await prisma.integrationConnection.updateMany({
      where: {
        id: connectionId,
        status: IntegrationStatus.ACTIVE,
        OR: [
          { syncInProgress: false },
          { syncLeaseExpiresAt: { lt: now } },
        ],
      },
      data: {
        syncInProgress: true,
        syncLeaseExpiresAt: leaseExpires,
        lastAttemptedAt: now,
      },
    });

    return result.count > 0;
  }

  /**
   * Releases connection lock and schedules next sync or retry.
   */
  public static async releaseConnection(
    connectionId: string,
    outcome: {
      success: boolean;
      errorMessage?: string;
      isPermanent?: boolean;
    }
  ): Promise<{ nextSyncAt: Date | null }> {
    const now = new Date();
    const connection = await prisma.integrationConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return { nextSyncAt: null };
    }

    if (outcome.success) {
      const nextSync = this.calculateNextSync(connection.syncFrequency, now);
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          syncInProgress: false,
          syncLeaseExpiresAt: null,
          lastSyncAt: now,
          nextSyncAt: nextSync,
          retryCount: 0,
          errorDetails: null,
          status: IntegrationStatus.ACTIVE,
        },
      });
      return { nextSyncAt: nextSync };
    }

    // Failure branch
    const currentRetries = connection.retryCount + 1;
    const isPermanent = outcome.isPermanent || this.isPermanentFailure(outcome.errorMessage || "");

    if (isPermanent || currentRetries >= MAX_RETRY_ATTEMPTS) {
      // Mark as error / halt retries
      const newStatus = outcome.errorMessage?.toUpperCase().includes("AUTH")
        ? IntegrationStatus.NEEDS_REAUTH
        : IntegrationStatus.ERROR;

      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          syncInProgress: false,
          syncLeaseExpiresAt: null,
          retryCount: currentRetries,
          errorDetails: outcome.errorMessage,
          status: newStatus,
          nextSyncAt: null, // Halt scheduled triggers until resolved
        },
      });
      return { nextSyncAt: null };
    } else {
      // Transient failure with remaining retries: schedule backoff
      const nextRetryAt = this.calculateBackoff(currentRetries, now);
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          syncInProgress: false,
          syncLeaseExpiresAt: null,
          retryCount: currentRetries,
          errorDetails: outcome.errorMessage,
          nextSyncAt: nextRetryAt,
        },
      });
      return { nextSyncAt: nextRetryAt };
    }
  }

  /**
   * Orchestrates synchronization for a single connection.
   * Enforces entitlement, atomic locking, calls 4.2 IngestionPipeline, and updates state.
   */
  public static async orchestrateSync(params: {
    connectionId: string;
    userId?: string;
    entityName?: "transactions" | "inventory";
    correlationId?: string;
  }): Promise<OrchestrationResult> {
    const correlationId = params.correlationId || CopilotLogger.createCorrelationId();

    const connection = await prisma.integrationConnection.findUnique({
      where: { id: params.connectionId },
    });

    if (!connection) {
      return {
        connectionId: params.connectionId,
        status: "FAILED",
        error: "CONNECTION_NOT_FOUND",
      };
    }

    // Validate tenant ownership if caller explicitly specified userId
    if (params.userId && connection.userId !== params.userId) {
      return {
        connectionId: params.connectionId,
        status: "FAILED",
        error: "UNAUTHORIZED_TENANT_ACCESS",
      };
    }

    // Ensure connection is active
    if (connection.status !== IntegrationStatus.ACTIVE) {
      return {
        connectionId: params.connectionId,
        status: "FAILED",
        error: `CONNECTION_INACTIVE_${connection.status}`,
      };
    }

    // 1. Entitlement Verification
    const entitlement = await EntitlementService.evaluateConnectorAccess(connection.userId, { correlationId });
    if (!entitlement.allowed) {
      await this.releaseConnection(connection.id, {
        success: false,
        errorMessage: entitlement.message || "PLAN_NOT_ENTITLED",
        isPermanent: true,
      });

      return {
        connectionId: connection.id,
        status: "SKIPPED_UNENTITLED",
        error: entitlement.message,
      };
    }

    // 2. Atomic Lease Claim
    const acquired = await this.claimConnection(connection.id);
    if (!acquired) {
      return {
        connectionId: connection.id,
        status: "SKIPPED_IN_PROGRESS",
      };
    }

    // 3. Execution via Milestone 4.2 IngestionPipeline
    const entity = params.entityName || "transactions";
    try {
      const ingestionResult: IngestionResult = await IngestionPipeline.executeSync({
        userId: connection.userId,
        connectionId: connection.id,
        entityName: entity,
        correlationId,
      });

      if (ingestionResult.status === "COMPLETED") {
        const { nextSyncAt } = await this.releaseConnection(connection.id, { success: true });
        return {
          connectionId: connection.id,
          jobId: ingestionResult.jobId,
          status: "COMPLETED",
          recordsFetched: ingestionResult.recordsFetched,
          recordsAccepted: ingestionResult.recordsAccepted,
          recordsDeduplicated: ingestionResult.recordsDeduplicated,
          nextSyncAt,
        };
      } else {
        const isPerm = this.isPermanentFailure(ingestionResult.errorMessage || "");
        const { nextSyncAt } = await this.releaseConnection(connection.id, {
          success: false,
          errorMessage: ingestionResult.errorMessage,
          isPermanent: isPerm,
        });

        return {
          connectionId: connection.id,
          jobId: ingestionResult.jobId,
          status: "FAILED",
          recordsFetched: ingestionResult.recordsFetched,
          recordsAccepted: ingestionResult.recordsAccepted,
          recordsDeduplicated: ingestionResult.recordsDeduplicated,
          error: ingestionResult.errorMessage,
          nextSyncAt,
        };
      }
    } catch (err: any) {
      const isPerm = this.isPermanentFailure(err.message || "");
      const { nextSyncAt } = await this.releaseConnection(connection.id, {
        success: false,
        errorMessage: err.message,
        isPermanent: isPerm,
      });

      return {
        connectionId: connection.id,
        status: "FAILED",
        error: err.message,
        nextSyncAt,
      };
    }
  }
}


