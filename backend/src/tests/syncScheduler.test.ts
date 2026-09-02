import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../lib/prisma";
import { ConnectionService } from "../services/integration/connectionService";
import { SyncOrchestratorService } from "../services/integration/syncOrchestratorService";
import { SyncSchedulerService } from "../services/integration/syncSchedulerService";
import { IntegrationStatus, SyncFrequency, SyncJobStatus } from "@prisma/client";

describe("Phase 4 — Milestone 4.3: Scheduled Background Synchronization Suite", () => {
  let testUserId: string;
  let unauthorizedUserId: string;
  let connectionId: string;
  let proPlanId: string;

  beforeAll(async () => {
    // 1. Create primary test user
    const user = await prisma.user.create({
      data: {
        fullName: "Scheduler Test User",
        username: `sched_user_${Date.now()}`,
        email: `sched_${Date.now()}@diralis.test`,
        password: "secure_password",
        status: "ACTIVE",
        emailVerified: true,
      },
    });
    testUserId = user.id;

    // 2. Create second user for isolation checks
    const unauth = await prisma.user.create({
      data: {
        fullName: "Unauthorized User",
        username: `unauth_user_${Date.now()}`,
        email: `unauth_${Date.now()}@diralis.test`,
        password: "secure_password",
        status: "ACTIVE",
        emailVerified: true,
      },
    });
    unauthorizedUserId = unauth.id;

    // 3. Ensure PRO plan exists
    let proPlan = await prisma.subscriptionPlan.findFirst({
      where: { code: "PRO", active: true },
      orderBy: { version: "desc" },
    });

    if (!proPlan) {
      proPlan = await prisma.subscriptionPlan.create({
        data: {
          code: "PRO",
          name: "Pro Plan",
          description: "Pro plan for scheduler tests",
          monthlyPrice: 49,
          currency: "USD",
          active: true,
          version: 1,
          limits: { maxActiveConnectors: 5 },
          features: { connectors: true },
        },
      });
    }
    proPlanId = proPlan.id;

    // 4. Create active subscription with currentKey
    await prisma.subscription.create({
      data: {
        userId: testUserId,
        planId: proPlanId,
        currentKey: `${testUserId}_current`,
        status: "ACTIVE",
        provider: "STRIPE",
      },
    });

    // 5. Create connection
    const conn = await ConnectionService.createConnection({
      userId: testUserId,
      providerId: "mock_pos",
      name: "Scheduler POS",
      config: { apiKey: "live_pos_key_123" },
      syncFrequency: "HOURLY",
    });
    connectionId = conn.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
    if (unauthorizedUserId) {
      await prisma.user.delete({ where: { id: unauthorizedUserId } });
    }
  });

  it("1. Due connection is discovered by scheduler, while future and inactive ones are ignored", async () => {
    const now = new Date();

    // Mark connection as due
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        status: IntegrationStatus.ACTIVE,
        syncFrequency: SyncFrequency.HOURLY,
        nextSyncAt: new Date(now.getTime() - 60000), // 1 minute in past
        syncInProgress: false,
      },
    });

    const dueList = await SyncSchedulerService.discoverDueConnections();
    const found = dueList.find((c) => c.id === connectionId);
    expect(found).toBeDefined();

    // Set connection in the future
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: { nextSyncAt: new Date(now.getTime() + 3600000) }, // 1 hour in future
    });
    const futureList = await SyncSchedulerService.discoverDueConnections();
    expect(futureList.find((c) => c.id === connectionId)).toBeUndefined();

    // Set connection as INACTIVE even if past
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        status: IntegrationStatus.INACTIVE,
        nextSyncAt: new Date(now.getTime() - 60000),
      },
    });
    const inactiveList = await SyncSchedulerService.discoverDueConnections();
    expect(inactiveList.find((c) => c.id === connectionId)).toBeUndefined();

    // Reset back to active and due
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        status: IntegrationStatus.ACTIVE,
        nextSyncAt: new Date(now.getTime() - 60000),
      },
    });
  });

  it("2. Concurrency control prevents same connection from running twice simultaneously", async () => {
    // Acquire first claim
    const claimedFirst = await SyncOrchestratorService.claimConnection(connectionId);
    expect(claimedFirst).toBe(true);

    // Immediate second claim attempt must be rejected
    const claimedSecond = await SyncOrchestratorService.claimConnection(connectionId);
    expect(claimedSecond).toBe(false);

    // Releasing the connection restores claimability
    await SyncOrchestratorService.releaseConnection(connectionId, { success: true });
    const connection = await prisma.integrationConnection.findUnique({ where: { id: connectionId } });
    expect(connection?.syncInProgress).toBe(false);
  });

  it("3. Successfully orchestrates sync via 4.2 IngestionPipeline and updates schedule timestamps", async () => {
    const result = await SyncOrchestratorService.orchestrateSync({
      connectionId,
      userId: testUserId,
      entityName: "transactions",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.recordsAccepted).toBeGreaterThan(0);
    expect(result.nextSyncAt).toBeDefined();

    // Verify DB state
    const updated = await prisma.integrationConnection.findUnique({ where: { id: connectionId } });
    expect(updated?.lastSyncAt).toBeDefined();
    expect(updated?.syncInProgress).toBe(false);
    expect(updated?.retryCount).toBe(0);
  });

  it("4. Stale/crashed worker lease is detected, timed-out SyncJob marked FAILED, and lock recovered", async () => {
    const pastTime = new Date(Date.now() - 1000);

    // Artificially simulate a crashed worker holding a lease
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        syncInProgress: true,
        syncLeaseExpiresAt: pastTime,
      },
    });

    const fakeJob = await prisma.syncJob.create({
      data: {
        connectionId,
        userId: testUserId,
        status: SyncJobStatus.RUNNING,
        startedAt: pastTime,
      },
    });

    const recoveredCount = await SyncOrchestratorService.recoverStaleLeases();
    expect(recoveredCount).toBeGreaterThanOrEqual(1);

    const checkConn = await prisma.integrationConnection.findUnique({ where: { id: connectionId } });
    expect(checkConn?.syncInProgress).toBe(false);
    expect(checkConn?.syncLeaseExpiresAt).toBeNull();

    const checkJob = await prisma.syncJob.findUnique({ where: { id: fakeJob.id } });
    expect(checkJob?.status).toBe(SyncJobStatus.FAILED);
    expect(checkJob?.errorMessage).toContain("STALE_LOCK_TIMEOUT");
  });

  it("5. Transient failure triggers bounded exponential retry calculation", async () => {
    const initial = await prisma.integrationConnection.findUnique({ where: { id: connectionId } });
    const prevRetries = initial?.retryCount || 0;

    await SyncOrchestratorService.claimConnection(connectionId);
    const outcome = await SyncOrchestratorService.releaseConnection(connectionId, {
      success: false,
      errorMessage: "ETIMEDOUT: upstream gateway unreachable",
    });

    expect(outcome.nextSyncAt).toBeDefined();

    const conn = await prisma.integrationConnection.findUnique({ where: { id: connectionId } });
    expect(conn?.retryCount).toBe(prevRetries + 1);
    expect(conn?.syncInProgress).toBe(false);
  });

  it("6. Strictly blocks unauthorized cross-tenant execution", async () => {
    const result = await SyncOrchestratorService.orchestrateSync({
      connectionId,
      userId: unauthorizedUserId,
    });

    expect(result.status).toBe("FAILED");
    expect(result.error).toBe("UNAUTHORIZED_TENANT_ACCESS");
  });

  it("7. Entitlement enforcement denies execution for unentitled users (FREE tier)", async () => {
    // Create a FREE tier user with no active subscription
    const freeUser = await prisma.user.create({
      data: {
        fullName: "Free Tier User",
        username: `free_user_${Date.now()}`,
        email: `free_${Date.now()}@diralis.test`,
        password: "secure_password",
        status: "ACTIVE",
        emailVerified: true,
      },
    });

    const freeConn = await prisma.integrationConnection.create({
      data: {
        userId: freeUser.id,
        providerId: "mock_pos",
        name: "Free POS",
        encryptedConfig: "iv:auth:cipher",
        status: IntegrationStatus.ACTIVE,
      },
    });

    const result = await SyncOrchestratorService.orchestrateSync({
      connectionId: freeConn.id,
      userId: freeUser.id,
    });

    expect(result.status).toBe("SKIPPED_UNENTITLED");

    // Clean up
    await prisma.user.delete({ where: { id: freeUser.id } });
  });
});

