import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../app";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";
import { ProactiveAnalysisService } from "../services/copilot/proactiveAnalysisService";

describe("Copilot Proactive Insights Pipeline Suite", () => {
  let user: { id: string; email: string };
  let token: string;
  let dataset: { id: string };

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

    user = await prisma.user.create({
      data: {
        email: "copilot_test_user@diralis.com",
        username: "copilot_tester",
        fullName: "Copilot Tester",
        password: "hashedpassword",
        status: "ACTIVE",
        emailVerified: true,
      },
    });

    token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET);

    dataset = await prisma.dataset.create({
      data: {
        userId: user.id,
        originalName: "Operations_2026.csv",
        filename: "ops_2026.csv",
        mimetype: "text/csv",
        size: 1024,
      },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.copilotInsight.deleteMany({ where: { userId: user.id } });
    await prisma.dataset.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  }, 30000);

  it("1. Analyzes dataset rows and creates proactive insights in database", async () => {
    const rows = [
      { latency: 45 },
      { latency: 48 },
      { latency: 42 },
      { latency: 47 },
      { latency: 50 },
      { latency: 450 }, // Critical outlier
    ];

    const count = await ProactiveAnalysisService.analyzeDataset(user.id, dataset.id, rows);
    expect(count).toBeGreaterThanOrEqual(1);

    const saved = await prisma.copilotInsight.findMany({ where: { datasetId: dataset.id } });
    expect(saved.length).toBe(count);
    expect(saved[0].severity).toBe("CRITICAL");
  });

  it("2. Retrieves proactive insights feed via GET /api/copilot/feed/:datasetId", async () => {
    const res = await request(app)
      .get(`/api/copilot/feed/${dataset.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.insights.length).toBeGreaterThanOrEqual(1);
    expect(res.body.insights[0].type).toBe("ANOMALY");
  });

  it("3. Dismisses an insight via POST /api/copilot/feed/:insightId/dismiss", async () => {
    const saved = await prisma.copilotInsight.findFirst({ where: { datasetId: dataset.id } });
    expect(saved).toBeDefined();

    const res = await request(app)
      .post(`/api/copilot/feed/${saved!.id}/dismiss`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const feedRes = await request(app)
      .get(`/api/copilot/feed/${dataset.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(feedRes.body.insights.find((i: any) => i.id === saved!.id)).toBeUndefined();
  });
});

