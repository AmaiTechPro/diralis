import { describe, it, expect, beforeAll } from "@jest/globals";
import { ToolRegistry } from "../services/copilot/toolRegistry";
import { CopilotOrchestrator } from "../services/copilot/copilotOrchestrator";

describe("Copilot Orchestrator & Tool Registry Suite", () => {
  beforeAll(() => {
    process.env.AI_PROVIDER = "mock";
  });

  it("1. ToolRegistry lists all registered deterministic tools", () => {
    const tools = ToolRegistry.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("compute_metric");
    expect(names).toContain("detect_anomalies");
    expect(names).toContain("rank_key_drivers");
    expect(names).toContain("generate_forecast");
    expect(names).toContain("run_scenario");
  });

  it("2. ToolRegistry executes compute_metric tool deterministically", async () => {
    const ctx = {
      userId: "user_test_123",
      datasetId: "dataset_test_123",
      rows: [{ sales: 50 }, { sales: 150 }],
    };

    const res = await ToolRegistry.executeTool("compute_metric", ctx, {
      definition: {
        id: "total_sales",
        name: "Total Sales",
        expression: "SUM",
        targetColumn: "sales",
        format: "CURRENCY",
        unit: "$",
      },
    });

    expect(res.value).toBe(200);
    expect(res.formattedValue).toBe("$200");
  });

  it("3. CopilotOrchestrator executes turn and generates grounded output with evidence", async () => {
    const req = {
      userId: "user_test_123",
      datasetId: "dataset_test_123",
      prompt: "Are there any anomalies or outliers in this data?",
      rows: [
        { val: 10 },
        { val: 11 },
        { val: 10 },
        { val: 12 },
        { val: 95 }, // Outlier
      ],
      mapSummary: "Sample MAP dataset with 5 rows and 1 column.",
    };

    const output = await CopilotOrchestrator.processTurn(req);
    expect(output.summary).toBeDefined();
    expect(output.deterministicEvidence.length).toBeGreaterThan(0);
    expect(output.insights.length).toBeGreaterThanOrEqual(1);
    expect(output.insights[0].severity).toBe("CRITICAL");
  });
});


