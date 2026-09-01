import { describe, it, expect, beforeAll } from "@jest/globals";
import { EntitlementService } from "../services/entitlementService";
import prisma from "../lib/prisma";

describe("Phase 3.1 — Unified 5-Tier Entitlement Enforcement Suite", () => {
  let freeUser: any;
  let foreignDataset: any;

  beforeAll(async () => {
    const timestamp = Date.now();

    freeUser = await prisma.user.create({
      data: {
        email: `free_user_${timestamp}@diralis.com`,
        username: `free_user_${timestamp}`,
        fullName: "Free Tier Tester",
        password: "hash_test_123",
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: `other_user_${timestamp}@diralis.com`,
        username: `other_user_${timestamp}`,
        fullName: "Foreign Tenant",
        password: "hash_test_123",
      },
    });

    foreignDataset = await prisma.dataset.create({
      data: {
        userId: otherUser.id,
        filename: "secret_data.csv",
        originalName: "secret_data.csv",
        size: 1024,
        mimetype: "text/csv",
      },
    });
  });

  it("1. Rejects unauthenticated caller with AUTH_REQUIRED (401)", async () => {
    const res = await EntitlementService.evaluate("", { requiredFeature: "aiChat" });
    expect(res.allowed).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.code).toBe("AUTH_REQUIRED");
  });

  it("2. Blocks cross-tenant dataset access with RESOURCE_UNAUTHORIZED (404)", async () => {
    const res = await EntitlementService.evaluate(freeUser.id, {
      datasetId: foreignDataset.id,
    });
    expect(res.allowed).toBe(false);
    expect(res.statusCode).toBe(404);
    expect(res.code).toBe("RESOURCE_UNAUTHORIZED");
  });

  it("3. Denies unentitled features with PLAN_NOT_ENTITLED (403)", async () => {
    const res = await EntitlementService.evaluate(freeUser.id, {
      requiredFeature: "executiveExports",
    });
    expect(res.allowed).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.code).toBe("PLAN_NOT_ENTITLED");
    expect(res.details?.tier).toBe("FREE");
  });

  it("4. Evaluates allowed feature when user is entitled", async () => {
    const res = await EntitlementService.evaluate(freeUser.id, {
      requiredFeature: "aiChat",
    });
    expect(res.allowed).toBe(true);
    expect(res.statusCode).toBe(200);
  });
});

