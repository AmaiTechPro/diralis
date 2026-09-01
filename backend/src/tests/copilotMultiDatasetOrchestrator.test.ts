import { describe, it, expect } from "vitest";
import { CopilotOrchestrator } from "../services/copilot/copilotOrchestrator";
import { ContextService } from "../services/copilot/contextService";

describe("Phase 3.2 — Milestone 3: Multi-Dataset Context & Orchestrator Routing", () => {
  const salesDataset = {
    id: "ds_sales",
    name: "Sales Orders",
    rows: [
      { customer_id: "c1", revenue: 500, period: "2024-Q1" },
      { customer_id: "c2", revenue: 750, period: "2024-Q2" },
      { customer_id: "c3", revenue: 300, period: "2024-Q3" },
      { customer_id: "c4", revenue: 900, period: "2024-Q4" },
      { customer_id: "c1", revenue: 600, period: "2025-Q1" },
      { customer_id: "c2", revenue: 850, period: "2025-Q2" },
      { customer_id: "c3", revenue: 350, period: "2025-Q3" },
      { customer_id: "c4", revenue: 1000, period: "2025-Q4" },
    ],
    columns: [
      { name: "customer_id", type: "string" },
      { name: "revenue", type: "number" },
      { name: "period", type: "string" },
    ],
  };

  const marketingDataset = {
    id: "ds_marketing",
    name: "Marketing Spend",
    rows: [
      { customer_id: "c1", ad_spend: 100 },
      { customer_id: "c2", ad_spend: 150 },
      { customer_id: "c3", ad_spend: 50 },
      { customer_id: "c4", ad_spend: 200 },
    ],
    columns: [
      { name: "customer_id", type: "string" },
      { name: "ad_spend", type: "number" },
    ],
  };

  it("1. Synthesizes composite MAP schema and auto-discovers relational join key", () => {
    const composite = ContextService.buildCompositeMAPContext([
      {
        id: salesDataset.id,
        name: salesDataset.name,
        rowCount: salesDataset.rows.length,
        columns: salesDataset.columns,
      },
      {
        id: marketingDataset.id,
        name: marketingDataset.name,
        rowCount: marketingDataset.rows.length,
        columns: marketingDataset.columns,
      },
    ]);

    expect(composite.datasetCount).toBe(2);
    expect(composite.potentialJoinKeys).toHaveLength(1);
    expect(composite.potentialJoinKeys[0].leftKey).toBe("customer_id");
    expect(composite.potentialJoinKeys[0].rightKey).toBe("customer_id");
    expect(composite.formattedContextString).toContain("COMPOSITE MULTI-DATASET CONTEXT");
  });

  it("2. Automatically routes and executes blend_datasets tool on cross-dataset intent", async () => {
    const res = await CopilotOrchestrator.processTurn({
      userId: "test_user",
      datasets: [salesDataset, marketingDataset],
      prompt: "Blend sales and marketing across customer_id and summarize performance.",
    });

    expect(res.analytical.toolsExecuted).toContain("blend_datasets");
    expect(res.evidence.some((e) => e.tool === "blend_datasets")).toBe(true);
    expect(res.analytical.available).toBe(true);
  });

  it("3. Automatically routes seasonal forecast query to generate_seasonal_forecast", async () => {
    const res = await CopilotOrchestrator.processTurn({
      userId: "test_user",
      datasets: [salesDataset],
      prompt: "What is our quarterly revenue forecast for the next year?",
    });

    expect(res.analytical.toolsExecuted).toContain("generate_seasonal_forecast");
    const forecastEvidence = res.evidence.find((e) => e.tool === "generate_seasonal_forecast");
    expect(forecastEvidence).toBeDefined();
    expect(forecastEvidence.result.modelType).toBe("HOLT_WINTERS_ADDITIVE");
    expect(forecastEvidence.result.points).toHaveLength(4);
  });

  it("4. Automatically routes driver query to analyze_multivariable_drivers", async () => {
    // Non-collinear dataset: profit = 10 + 2*cost + 5*hours
    const multiColRows = [
      { profit: 100, cost: 20, hours: 10 },
      { profit: 210, cost: 40, hours: 22 },
      { profit: 140, cost: 30, hours: 12 },
      { profit: 320, cost: 60, hours: 35 },
      { profit: 260, cost: 50, hours: 28 },
      { profit: 380, cost: 70, hours: 42 },
    ];

    const res = await CopilotOrchestrator.processTurn({
      userId: "test_user",
      rows: multiColRows,
      prompt: "Analyze the multivariable key drivers for profit based on cost and hours.",
    });

    expect(res.analytical.toolsExecuted).toContain("analyze_multivariable_drivers");
    const driverEvidence = res.evidence.find((e) => e.tool === "analyze_multivariable_drivers");
    expect(driverEvidence.result.status).toBe("SUCCESS");
    expect(driverEvidence.result.drivers.length).toBe(2);
  });
});


