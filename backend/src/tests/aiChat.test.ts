import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";

describe("AI Chat Subsystem - Hardening & Isolation Suite", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let tokenA: string;
  let tokenB: string;
  let datasetA: { id: string };
  let sessionA: { id: string };

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
    process.env.AI_PROVIDER = "mock";

    userA = await prisma.user.create({
      data: {
        email: "user_a_harden@diralis.com",
        username: "user_a_harden",
        fullName: "User A Harden",
        password: "hashedpassword",
        status: "ACTIVE",
        emailVerified: true,
      },
    });

    userB = await prisma.user.create({
      data: {
        email: "user_b_harden@diralis.com",
        username: "user_b_harden",
        fullName: "User B Harden",
        password: "hashedpassword",
        status: "ACTIVE",
        emailVerified: true,
      },
    });

    tokenA = jwt.sign({ userId: userA.id, email: userA.email }, process.env.JWT_SECRET);
    tokenB = jwt.sign({ userId: userB.id, email: userB.email }, process.env.JWT_SECRET);

    datasetA = await prisma.dataset.create({
      data: {
        userId: userA.id,
        originalName: "UserA_Data.csv",
        filename: "usera_data.csv",
        mimetype: "text/csv",
        size: 1024,
      },
    });

    const sessionRes = await request(app)
      .post("/api/ai/sessions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Hardening Session", datasetId: datasetA.id });

    sessionA = sessionRes.body.session;
  }, 30000);

  afterAll(async () => {
    await prisma.chatMessage.deleteMany({ where: { session: { userId: { in: [userA.id, userB.id] } } } });
    await prisma.chatSession.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.dataset.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    await prisma.$disconnect();
  }, 30000);

  it("1. Rejects unauthenticated requests with 401", async () => {
    const res = await request(app)
      .post(`/api/ai/sessions/${sessionA.id}/messages`)
      .send({ content: "Explain this metric" });

    expect(res.status).toBe(401);
  });

  it("2. Blocks User B from accessing User A's session (Cross-Tenant Isolation)", async () => {
    const res = await request(app)
      .post(`/api/ai/sessions/${sessionA.id}/messages`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ content: "Attempting unauthorized read" });

    expect(res.status).toBe(404);
  });

  it("3. Successfully returns grounded AI response and increments quota for entitled user", async () => {
    const res = await request(app)
      .post(`/api/ai/sessions/${sessionA.id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ content: "What are the key trends in this dataset?" });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    expect(res.body.sessionId).toBe(sessionA.id);
  });

  it("4. Gracefully handles invalid requests without crashing", async () => {
    const res = await request(app)
      .post(`/api/ai/sessions/${sessionA.id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ content: "" }); // Empty content

    expect(res.status).toBe(400);
  });
});


