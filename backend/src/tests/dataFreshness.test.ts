import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../lib/prisma";
import { DataFreshnessService } from "../services/integration/dataFreshnessService";
import { IntegrationStatus, SyncFrequency, SyncJobStatus } from "@prisma/client";

describe("Milestone 4.5 — Data Freshness & Status Intelligence Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("A. Deterministic Freshness Classification Logic", () => {
    const baseConn = {
      status: IntegrationStatus.ACTIVE,
      syncInProgress: false,
      syncLeaseExpiresAt: null,
      lastSyncAt: null as Date | null,
      lastAttemptedAt: null as Date | null,
      nextSyncAt: null as Date | null,
      syncFrequency: SyncFrequency.HOURLY,
      errorDetails: null as string | null,
    };

    it("1. returns NEVER_SYNCED when connection has no successful sync", () => {
      const freshness = DataFreshnessService.evaluateFreshness(baseConn, null);
      expect(freshness).toBe("NEVER_SYNCED");
    });

    it("2. returns SYNCING when syncInProgress is true with valid lease", () => {
      const now = new Date();
      const lease = new Date(now.getTime() + 5 * 60 * 1000); // 5 min in future
      const conn = {
        ...baseConn,
        syncInProgress: true,
        syncLeaseExpiresAt: lease,
      };

      const freshness = DataFreshnessService.evaluateFreshness(conn, null, now);
      expect(freshness).toBe("SYNCING");
    });

    it("3. ignores syncInProgress if sync lease has expired", () => {
      const now = new Date();
      const expiredLease = new Date(now.getTime() - 10 * 60 * 1000); // 10 min ago
      const conn = {
        ...baseConn,
        syncInProgress: true,
        syncLeaseExpiresAt: expiredLease,
        lastSyncAt: new Date(now.getTime() - 20 * 60 * 1000), // 20m ago (hourly)
      };

      const freshness = DataFreshnessService.evaluateFreshness(conn, null, now);
      expect(freshness).toBe("FRESH"); // Falls through to time-window check
    });

    it("4. returns NEEDS_REAUTH when status is NEEDS_REAUTH or error indicates auth failure", () => {
      const connAuth1 = {
        ...baseConn,
        status: IntegrationStatus.NEEDS_REAUTH,
      };
      expect(DataFreshnessService.evaluateFreshness(connAuth1, null)).toBe("NEEDS_REAUTH");

      const connAuth2 = {
        ...baseConn,
        errorDetails: "AUTHENTICATION_FAILURE: token expired",
      };
      expect(DataFreshnessService.evaluateFreshness(connAuth2, null)).toBe("NEEDS_REAUTH");
    });

    it("5. returns ERROR when connection status is ERROR or latest job failed", () => {
      const now = new Date();
      const conn = {
        ...baseConn,
        lastSyncAt: new Date(now.getTime() - 60 * 60 * 1000),
      };

      const failedJob = {
        status: SyncJobStatus.FAILED,
        completedAt: new Date(now.getTime() - 10 * 60 * 1000), // after last sync
      };

      const freshness = DataFreshnessService.evaluateFreshness(conn, failedJob, now);
      expect(freshness).toBe("ERROR");
    });

    it("6. returns FRESH when sync was recent within frequency threshold + grace", () => {
      const now = new Date();
      // Hourly threshold = 60m + 15m grace = 75m
      const connHourly = {
        ...baseConn,
        syncFrequency: SyncFrequency.HOURLY,
        lastSyncAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
      };
      expect(DataFreshnessService.evaluateFreshness(connHourly, null, now)).toBe("FRESH");

      // Daily threshold = 24h + 2h grace = 26h
      const connDaily = {
        ...baseConn,
        syncFrequency: SyncFrequency.DAILY,
        lastSyncAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12h ago
      };
      expect(DataFreshnessService.evaluateFreshness(connDaily, null, now)).toBe("FRESH");
    });

    it("7. returns STALE when sync elapsed time exceeds frequency interval", () => {
      const now = new Date();
      // Hourly with 90 min elapsed (exceeds 75m threshold)
      const connHourly = {
        ...baseConn,
        syncFrequency: SyncFrequency.HOURLY,
        lastSyncAt: new Date(now.getTime() - 90 * 60 * 1000),
      };
      expect(DataFreshnessService.evaluateFreshness(connHourly, null, now)).toBe("STALE");

      // Daily with 30 hours elapsed (exceeds 26h threshold)
      const connDaily = {
        ...baseConn,
        syncFrequency: SyncFrequency.DAILY,
        lastSyncAt: new Date(now.getTime() - 30 * 60 * 60 * 1000),
      };
      expect(DataFreshnessService.evaluateFreshness(connDaily, null, now)).toBe("STALE");
    });

    it("8. returns DISABLED when status is INACTIVE, REVOKED or PAUSED", () => {
      const conn = {
        ...baseConn,
        status: IntegrationStatus.INACTIVE,
      };
      expect(DataFreshnessService.evaluateFreshness(conn, null)).toBe("DISABLED");
    });
  });

  describe("B. Error Message Sanitization (Zero Leakage)", () => {
    it("1. translates rate limit technical responses to safe advisory", () => {
      const msg = DataFreshnessService.sanitizeErrorMessage("HTTP 429: API rate limit exceeded");
      expect(msg).toContain("temporarily limited requests");
      expect(msg).not.toContain("429");
    });

    it("2. translates authentication failures safely without leaking keys", () => {
      const msg = DataFreshnessService.sanitizeErrorMessage("AUTHENTICATION_FAILURE: shpca_9948291 invalid");
      expect(msg).toContain("authorization is no longer valid");
      expect(msg).not.toContain("shpca_9948291");
    });

    it("3. handles null/undefined gracefully", () => {
      expect(DataFreshnessService.sanitizeErrorMessage(null)).toBeNull();
    });
  });

  describe("C. Tenant Isolation & Safe Enrichment", () => {
    it("1. queries database strictly with userId and connectionId", async () => {
      const mockConn = {
        id: "conn_123",
        userId: "user_owner",
        providerId: "shopify",
        name: "My Retail Store",
        status: IntegrationStatus.ACTIVE,
        syncInProgress: false,
        syncLeaseExpiresAt: null,
        lastSyncAt: new Date(),
        lastAttemptedAt: new Date(),
        nextSyncAt: new Date(),
        syncFrequency: SyncFrequency.HOURLY,
        retryCount: 0,
        errorDetails: null,
        syncJobs: [
          {
            id: "job_1",
            status: SyncJobStatus.COMPLETED,
            recordsFetched: 50,
            recordsAccepted: 50,
            recordsDeduplicated: 0,
            errorMessage: null,
            completedAt: new Date(),
            createdAt: new Date(),
          },
        ],
      };

      vi.spyOn(prisma.integrationConnection, "findFirst").mockResolvedValue(mockConn as any);

      const result = await DataFreshnessService.getConnectionFreshness("user_owner", "conn_123", true);

      expect(prisma.integrationConnection.findFirst).toHaveBeenCalledWith({
        where: { id: "conn_123", userId: "user_owner" },
        include: expect.any(Object),
      });

      expect(result).not.toBeNull();
      expect(result?.freshness).toBe("FRESH");
      expect(result?.recordsLastSynced).toBe(50);
      expect(result?.provider).toBe("SHOPIFY");
      // Must not expose internal credentials
      expect((result as any)?.encryptedConfig).toBeUndefined();
    });

    it("2. returns null when tenant does not own the requested connection", async () => {
      vi.spyOn(prisma.integrationConnection, "findFirst").mockResolvedValue(null);

      const result = await DataFreshnessService.getConnectionFreshness("user_attacker", "conn_target");
      expect(result).toBeNull();
    });
  });
});



