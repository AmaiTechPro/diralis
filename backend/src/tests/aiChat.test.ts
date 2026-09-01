import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";
import { SubscriptionStatus } from "@prisma/client";

describe("AI Chat Subsystem - Hardening & Isolation Suite", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let tokenA: string;
  let tokenB: string;
  let datasetA: { id: string };
  let proPlan: { id: string };

  beforeAll(async () => {
    process.env.AI_PROVIDER = "mock";
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

    // 1. Clean up existing test records
    await prisma.chatMessage.deleteMany({
      where: { session: { user: { email: { in: ["ai_test_a@diralis.com", "ai_test_b@diralis.com"] } } } },
    });
    await prisma.chatSession.deleteMany({
      where: { user: { email: { in: ["ai_test_a@diralis.com", "ai_test_b@diralis.com"] } } },
    });
    await prisma.dataset.deleteMany({
      where: { user: { email: { in: ["ai_test_a@diralis.com", "ai_test_b@diralis.com"] } } },
    });
    await prisma.subscription.deleteMany({
      where: { user: { email: { in: ["ai_test_a@diralis.com", "ai_test_b@diralis.com"] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["ai_test_a@diralis.com", "ai_test_b@diralis.com"] } },
    });

    // 2. Ensure PRO Plan exists
    proPlan = await prisma.subscriptionPlan.upsert({
      where: { code_version: { code: "PRO_TEST", version: 1 } },
      update: {},
      create: {
        code: "PRO_TEST",
        version: 1,
        name: "Pro Plan (Test)",
        monthlyPrice: 2900,
        currency: "USD",
        active: true,
        features: {
          aiChat: true,
          advancedAnalytics: true,
        },
        limits: {
          aiRequestsPerMonth: 50,
          datasets: 10,
        },
      },
    });

    // 3. Create User A (subscribed to PRO)
    userA = await prisma.user.create({
      data: {
        email: "ai_test_a@diralis.com",
        username: "ai_user_a",
        fullName: "AI Tester Alpha",
        password: "hashedpassword",
        status: "ACTIVE",
        emailVerified: true,
      },
    });

    await prisma.subscription.create({
      data: {
        userId: userA.id,
        planId: proPlan.id,
        currentKey: `${userA.id}_current`,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    tokenA = jwt.sign({ userId: userA.id, email: userA.email }, process.env.JWT_SECRET);

    // 4. Create User B (default)
    userB = await prisma.user.create({
      data: {
        email: "ai_test_b@diralis.com",
        username: "ai_user_b",
        fullName: "AI Tester Beta",
        password: "hashedpassword",
        status: "ACTIVE",
        emailVerified: true,
      },
    });
    tokenB = jwt.sign({ userId: userB.id, email: userB.email }, process.env.JWT_SECRET);

    // 5. Create Dataset owned by User A
    datasetA = await prisma.dataset.create({
      data: {
        userId: userA.id,
        originalName: "Q3_Revenue_Metrics.csv",
        filename: "q3_revenue_mock.csv",
        mimetype: "text/csv",
        size: 10240,
      },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.chatMessage.deleteMany({
      where: { session: { userId: { in: [userA.id, userB.id] } } },
    });
    await prisma.chatSession.deleteMany({
      where: { userId: { in: [userA.id, userB.id] } },
    });
    await prisma.dataset.deleteMany({
      where: { userId: { in: [userA.id, userB.id] } },
    });
    await prisma.subscription.deleteMany({
      where: { userId: { in: [userA.id, userB.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    });
    await prisma.subscriptionPlan.deleteMany({
      where: { code: "PRO_TEST" },
    });
    await prisma.$disconnect();
  }, 30000);

  it("1. Rejects unauthenticated requests with 401", async () => {
    const res = await request(app)
      .post("/api/ai")
      .send({ message: "What are my top trends?" });

    expect(res.status).toBe(401);
  });

  it("2. Blocks User B from accessing User A's dataset (Cross-Tenant Isolation)", async () => {
    const res = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        message: "Summarize dataset",
        datasetId: datasetA.id,
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found in your workspace/i);
  });

  it("3. Successfully returns grounded AI response and increments quota for entitled user", async () => {
    const res = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        message: "Summarize my Q3 performance",
        datasetId: datasetA.id,
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.usage.current).toBe(1);

    const savedMessages = await prisma.chatMessage.findMany({
      where: { sessionId: res.body.sessionId },
    });
    expect(savedMessages).toHaveLength(2);
  });

  it("4. Gracefully handles simulated upstream provider failures without crashing", async () => {
    const res = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        message: "Simulate provider crash __SIMULATE_FAILURE__",
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/AI analysis request failed/i);
  });
});


