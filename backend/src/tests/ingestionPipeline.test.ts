import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { NormalizationService } from "../services/integration/normalizationService";
import { IngestionPipeline } from "../services/integration/ingestionPipeline";
import { ConnectionService } from "../services/integration/connectionService";

describe("Phase 4 — Milestone 4.2: Ingestion & Canonical Normalization Suite", () => {
  let testUserId: string;
  let connectionId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        fullName: "Ingestion Test User",
        username: `ingest_user_${Date.now()}`,
        email: `ingest_${Date.now()}@diralis.test`,
        password: "secure_password",
        status: "ACTIVE",
        emailVerified: true,
      },
    });
    testUserId = user.id;

    // Ensure PRO plan exists
    let proPlan = await prisma.subscriptionPlan.findFirst({
      where: { code: "PRO", active: true },
      orderBy: { version: "desc" },
    });

    if (!proPlan) {
      proPlan = await prisma.subscriptionPlan.create({
        data: {
          code: "PRO",
          name: "Pro Plan",
          description: "Pro tier for integration testing",
          monthlyPrice: 49,
          currency: "USD",
          active: true,
          version: 1,
          limits: { maxActiveConnectors: 5 },
          features: { connectors: true },
        },
      });
    }

    // Create active subscription with currentKey
    await prisma.subscription.create({
      data: {
        userId: testUserId,
        planId: proPlan.id,
        currentKey: `${testUserId}_current`,
        status: "ACTIVE",
        provider: "STRIPE",
      },
    });

    // Create integration connection
    const conn = await ConnectionService.createConnection({
      userId: testUserId,
      providerId: "mock_pos",
      name: "Downtown POS",
      config: { apiKey: "live_pos_key_123" },
      syncFrequency: "HOURLY",
    });
    connectionId = conn.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  it("1. Deterministically normalizes transactions with field mapping and type coercion", () => {
    const rawData = [
      {
        order_num: "tx_101",
        created_at: "2026-09-01T10:00:00Z",
        amount: "150.50",
        tax_val: "15.05",
        status: "completed",
      },
    ];

    const mapping = {
      order_num: "externalId",
      created_at: "transactionDate",
      amount: "totalAmount",
      tax_val: "tax",
    };

    const result = NormalizationService.normalizeTransactions(rawData, mapping);
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(0);

    const tx = result.accepted[0];
    expect(tx.externalId).toBe("tx_101");
    expect(tx.totalAmount).toBe(150.5);
    expect(tx.tax).toBe(15.05);
    expect(tx.currency).toBe("USD");
  });

  it("2. Safely rejects malformed transactions without throwing", () => {
    const malformed = [
      {
        order_num: "", // missing ID
        created_at: "invalid-date",
        amount: "not-a-number",
      },
    ];

    const result = NormalizationService.normalizeTransactions(malformed, {
      order_num: "externalId",
      created_at: "transactionDate",
      amount: "totalAmount",
    });

    expect(result.accepted).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain("MISSING_REQUIRED_FIELD");
  });

  it("3. Normalizes inventory items with numeric stock and derived valuation", () => {
    const rawInventory = [
      {
        item_code: "SKU-990",
        item_title: "Arabica Beans 1kg",
        qty: "40",
        cost: "12.50",
      },
    ];

    const mapping = {
      item_code: "sku",
      item_title: "productName",
      qty: "currentStock",
      cost: "unitCost",
    };

    const result = NormalizationService.normalizeInventory(rawInventory, mapping);
    expect(result.accepted).toHaveLength(1);
    const item = result.accepted[0];
    expect(item.sku).toBe("SKU-990");
    expect(item.currentStock).toBe(40);
    expect(item.unitCost).toBe(12.5);
    expect(item.inventoryValue).toBe(500); // 40 * 12.5
  });

  it("4. IngestionPipeline executes full batch sync, persists canonical data, and advances cursor", async () => {
    const syncResult = await IngestionPipeline.executeSync({
      userId: testUserId,
      connectionId,
      entityName: "transactions",
      limit: 5,
    });

    expect(syncResult.status).toBe("COMPLETED");
    expect(syncResult.recordsFetched).toBe(5);
    expect(syncResult.recordsAccepted).toBe(5);
    expect(syncResult.cursorAdvanced).toBe(true);

    // Verify records persisted in PostgreSQL
    const persisted = await prisma.canonicalTransaction.findMany({
      where: { userId: testUserId, connectionId },
    });
    expect(persisted.length).toBe(5);
  });

  it("5. Re-running sync with identical records deduplicates safely (Idempotency)", async () => {
    const initialCount = await prisma.canonicalTransaction.count({
      where: { userId: testUserId, connectionId },
    });

    // Reset cursor to simulate re-fetching the same batch window
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: { cursor: Prisma.DbNull },
    });

    // Re-run the sync with identical records
    const reSyncResult = await IngestionPipeline.executeSync({
      userId: testUserId,
      connectionId,
      entityName: "transactions",
      limit: 5,
    });

    expect(reSyncResult.status).toBe("COMPLETED");
    expect(reSyncResult.recordsDeduplicated).toBe(5);

    // Total rows in DB should remain unchanged due to upsert
    const finalCount = await prisma.canonicalTransaction.count({
      where: { userId: testUserId, connectionId },
    });
    expect(finalCount).toBe(initialCount);
  });

  it("6. Strictly blocks cross-tenant execution and manipulation", async () => {
    await expect(
      IngestionPipeline.executeSync({
        userId: "unauthorized_stranger_id",
        connectionId,
        entityName: "transactions",
      })
    ).rejects.toThrow("UNAUTHORIZED_CONNECTION");
  });
});


