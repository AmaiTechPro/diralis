import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";
import { SubscriptionStatus } from "@prisma/client";

describe("AI Chat Subsystem - Multi-Turn & History Integration Suite", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let tokenA: string;
  let tokenB: string;
  let datasetA: { id: string };
  let proPlan: { id: string };
  let testSessionId: string;

  beforeAll(async () => {
    process.env.AI_PROVIDER = "mock";
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

    // Cleanup
    await prisma.chatMessage.deleteMany({
      where: { session: { user: { email: { in: ["mt_user_a@diralis.com", "mt_user_b@diralis.com"] } } } },
    });
    await prisma.chatSession.deleteMany({
      where: { user: { email: { in: ["mt_user_a@diralis.com", "mt_user_b@diralis.com"] } } },
    });
    await prisma.dataset.deleteMany({
      where: { user: { email: { in: ["mt_user_a@diralis.com", "mt_user_b@diralis.com"] } } },
    });
    await prisma.subscription.deleteMany({
      where: { user: { email: { in: ["mt_user_a@diralis.com", "mt_user_b@diralis.com"] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["mt_user_a@diralis.com", "mt_user_b@diralis.com"] } },
    });

    // Create PRO Plan
    proPlan = await prisma.subscriptionPlan.upsert({
      where: { code_version: { code: "PRO_MT_TEST", version: 1 } },
      update: {},
      create: {
        code: "PRO_MT_TEST",
        version: 1,
        name: "Pro Multi-Turn Plan",
        monthlyPrice: 2900,
        currency: "USD",
        active: true,
        features: { aiChat: true, advancedAnalytics: true },
        limits: { aiRequestsPerMonth: 50, datasets: 10 },
      },
    });

    // Create User A with PRO Subscription
    userA = await prisma.user.create({
      data: {
        email: "mt_user_a@diralis.com",
        username: "mt_user_a",
        fullName: "Multi Turn Alpha",
        password: "hashedpassword",
        status: "ACTIVE",
        emailVerified: true,
      },
    });

    await prisma.subscription.create({
      data: {
        userId: userA.id,
        planId: proPlan.id,
        currentKey: `${userA.id}_current_mt`,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    tokenA = jwt.sign({ userId: userA.id, email: userA.email }, process.env.JWT_SECRET);

    // Create User B (unsubscribed)
    userB = await prisma.user.create({
      data: {
        email: "mt_user_b@diralis.com",
        username: "mt_user_b",
        fullName: "Multi Turn Beta",
        password: "hashedpassword",
        status: "ACTIVE",
        emailVerified: true,
      },
    });
    tokenB = jwt.sign({ userId: userB.id, email: userB.email }, process.env.JWT_SECRET);

    // Create Dataset for User A
    datasetA = await prisma.dataset.create({
      data: {
        userId: userA.id,
        originalName: "Financial_Report_2026.csv",
        filename: "fin_rep_2026.csv",
        mimetype: "text/csv",
        size: 20480,
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
      where: { code: "PRO_MT_TEST" },
    });
    await prisma.$disconnect();
  }, 30000);

  it("1. Creates a new chat session linked to a dataset", async () => {
    const res = await request(app)
      .post("/api/ai/sessions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "Q3 Financial Review",
        datasetId: datasetA.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.session.id).toBeDefined();
    expect(res.body.session.datasetId).toBe(datasetA.id);
    testSessionId = res.body.session.id;
  });

  it("2. Blocks User B from creating a session with User A's dataset", async () => {
    const res = await request(app)
      .post("/api/ai/sessions")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        title: "Unauthorized Session",
        datasetId: datasetA.id,
      });

    expect(res.status).toBe(404);
  });

  it("3. Sends Turn 1 message and auto-increments quota and messages", async () => {
    const res = await request(app)
      .post(`/api/ai/sessions/${testSessionId}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        content: "What is our overall net revenue?",
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    expect(res.body.sessionId).toBe(testSessionId);
    expect(res.body.usage.current).toBe(1);
  });

  it("4. Sends Turn 2 follow-up message maintaining session context", async () => {
    const res = await request(app)
      .post(`/api/ai/sessions/${testSessionId}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        content: "How does that compare to the previous period?",
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    expect(res.body.usage.current).toBe(2);
  });

  it("5. Blocks User B from accessing or messaging User A's session", async () => {
    const res = await request(app)
      .post(`/api/ai/sessions/${testSessionId}/messages`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        content: "Attempt cross-tenant injection",
      });

    expect(res.status).toBe(404);
  });

  it("6. Retrieves message history in chronological order with pagination", async () => {
    const res = await request(app)
      .get(`/api/ai/sessions/${testSessionId}/messages?page=1&limit=10`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBe(4); // 2 user + 2 assistant messages
    expect(res.body.messages[0].role).toBe("user");
    expect(res.body.messages[1].role).toBe("assistant");
    expect(res.body.pagination.total).toBe(4);
  });

  it("7. Lists user sessions with correct message counts", async () => {
    const res = await request(app)
      .get("/api/ai/sessions?page=1&limit=10")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);
    const session = res.body.sessions.find((s: any) => s.id === testSessionId);
    expect(session).toBeDefined();
    expect(session.messageCount).toBe(4);
  });

  it("8. Deletes session and confirms cascading message cleanup", async () => {
    const res = await request(app)
      .delete(`/api/ai/sessions/${testSessionId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);

    const checkMessages = await prisma.chatMessage.findMany({
      where: { sessionId: testSessionId },
    });
    expect(checkMessages).toHaveLength(0);
  });
});


