import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../lib/prisma";
import { ProactiveAnalysisService } from "../services/copilot/proactiveAnalysisService";
import { EntitlementService } from "../services/entitlementService";
import { CopilotOrchestrator } from "../services/copilot/copilotOrchestrator";
import { ScenarioEngine } from "../services/engines/scenarioEngine";
import { MetricEngine } from "../services/engines/metricEngine";

describe("Phase 3.1 — Milestone 4: End-to-End Copilot User Journey Audit Suite", () => {
  let testUser: any;
  let dataset: any;
  let generatedInsightId: string;

  const sampleRows = [
    { department: "Engineering", salary: 110000, tenureMonths: 24, performanceScore: 4.8 },
    { department: "Engineering", salary: 125000, tenureMonths: 36, performanceScore: 4.9 },
    { department: "Engineering", salary: 95000, tenureMonths: 12, performanceScore: 4.2 },
    { department: "Sales", salary: 80000, tenureMonths: 18, performanceScore: 3.9 },
    { department: "Sales", salary: 85000, tenureMonths: 22, performanceScore: 4.1 },
    { department: "Marketing", salary: 75000, tenureMonths: 14, performanceScore: 3.8 },
    { department: "Executive", salary: 980000, tenureMonths: 60, performanceScore: 4.9 }, // Critical outlier
  ];

  beforeAll(async () => {
    process.env.AI_PROVIDER = "mock";
    const timestamp = Date.now();

    // 1. Create Onboarded User
    testUser = await prisma.user.create({
      data: {
        email: `journey_user_${timestamp}@diralis.com`,
        username: `journey_user_${timestamp}`,
        fullName: "Journey Business Tester",
        password: "hash_secure_password_123",
      },
    });

    // 2. Ingest Dataset
    dataset = await prisma.dataset.create({
      data: {
        userId: testUser.id,
        filename: "q3_workforce_data.json",
        originalName: "q3_workforce_data.json",
        size: 4096,
        mimetype: "application/json",
      },
    });
  });

  afterAll(async () => {
    if (testUser) {
      await prisma.copilotInsight.deleteMany({ where: { userId: testUser.id } });
      await prisma.chatSession.deleteMany({ where: { userId: testUser.id } });
      await prisma.dataset.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.deleteMany({ where: { id: testUser.id } });
    }
  });

  it("Step 1: MetricEngine calculates verified deterministic baseline without hallucination", () => {
    const metricDef: any = {
      id: "total_payroll",
      name: "Total Payroll",
      expression: "SUM",
      targetColumn: "salary",
      format: "CURRENCY",
      unit: "$",
    };

    const metricResult = MetricEngine.computeMetric(metricDef, sampleRows);
    expect(metricResult.value).toBe(1550000);
    expect(metricResult.formattedValue).toBe("$1,550,000");
  });

  it("Step 2: Proactive pipeline discovers high-salary anomaly and persists insight", async () => {
    const proactiveResult = await ProactiveAnalysisService.analyzeDataset(
      testUser.id,
      dataset.id,
      sampleRows
    );

    expect(proactiveResult.status).toBe("COMPLETED");
    expect(proactiveResult.insightsCreated).toBeGreaterThanOrEqual(1);

    const savedInsights = await prisma.copilotInsight.findMany({
      where: { userId: testUser.id, datasetId: dataset.id },
    });
    expect(savedInsights.length).toBeGreaterThanOrEqual(1);
    generatedInsightId = savedInsights[0].id;
    expect(savedInsights[0].severity).toBe("CRITICAL");
  });

  it("Step 3: Centralized 5-tier entitlement evaluates capability and quota safely", async () => {
    const decision = await EntitlementService.evaluate(testUser.id, {
      requiredFeature: "aiChat",
      quotaMetric: "aiRequestsPerMonth",
      datasetId: dataset.id,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.statusCode).toBe(200);
  });

  it("Step 4: Orchestrator executes conversational turn grounded on verified numbers", async () => {
    const orchestratorReq = {
      userId: testUser.id,
      datasetId: dataset.id,
      prompt: "Are there any salary outliers in our workforce data?",
      rows: sampleRows,
      mapSummary: "Workforce compensation dataset with 7 records.",
    };

    const turnResult = await CopilotOrchestrator.processTurn(orchestratorReq);
    expect(turnResult.status).toBe("SUCCESS");
    expect(turnResult.summary).toBeDefined();
    expect(turnResult.evidence.length).toBeGreaterThan(0);
    expect(turnResult.insights.length).toBeGreaterThanOrEqual(1);
    expect(turnResult.insights[0].severity).toBe("CRITICAL");
  });

  it("Step 5: Scenario Engine executes what-if simulation without mutating dataset", () => {
    const metricDef: any = {
      id: "total_payroll",
      name: "Total Payroll",
      expression: "SUM",
      targetColumn: "salary",
      format: "CURRENCY",
    };

    const simulation = ScenarioEngine.evaluateWhatIf(metricDef, sampleRows, [
      {
        variableName: "Workforce Merit Increase",
        targetColumn: "salary",
        deltaPercentage: 0.10, // +10%
      },
    ]);

    expect(simulation.baselineValue).toBe(1550000);
    expect(simulation.simulatedValue).toBe(1705000);
    expect(simulation.absoluteDifference).toBe(155000);
    expect(simulation.percentageDifference).toBe(10);
    expect(sampleRows[0].salary).toBe(110000); // Immutable baseline verified
  });

  it("Step 6: User dismisses insight and cleans up workspace", async () => {
    const updated = await prisma.copilotInsight.update({
      where: { id: generatedInsightId },
      data: { dismissedAt: new Date() },
    });

    expect(updated.dismissedAt).not.toBeNull();

    const activeInsights = await prisma.copilotInsight.findMany({
      where: { userId: testUser.id, datasetId: dataset.id, dismissedAt: null },
    });
    expect(activeInsights.length).toBe(0);
  });
});
