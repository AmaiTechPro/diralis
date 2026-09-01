import { describe, it, expect } from "vitest";
import { CopilotOrchestrator } from "../services/copilot/copilotOrchestrator";
import { BlendingEngine } from "../services/copilot/blendingEngine";
import { ForecastEngine } from "../services/engines/forecastEngine";
import { MultiDriverEngine } from "../services/engines/multiDriverEngine";

describe("Phase 3.2 — Milestone 4: End-to-End Predictive Analytics Pipeline", () => {
  const transactions = [
    { order_id: "o1", customer_id: "c101", amount: 120, period: "2024-Q1" },
    { order_id: "o2", customer_id: "c102", amount: 250, period: "2024-Q2" },
    { order_id: "o3", customer_id: "c103", amount: 180, period: "2024-Q3" },
    { order_id: "o4", customer_id: "c104", amount: 310, period: "2024-Q4" },
    { order_id: "o5", customer_id: "c101", amount: 140, period: "2025-Q1" },
    { order_id: "o6", customer_id: "c102", amount: 290, period: "2025-Q2" },
    { order_id: "o7", customer_id: "c103", amount: 210, period: "2025-Q3" },
    { order_id: "o8", customer_id: "c104", amount: 360, period: "2025-Q4" },
  ];

  const operationalMetrics = [
    { customer_id: "c101", ad_clicks: 45, support_tickets: 2 },
    { customer_id: "c102", ad_clicks: 80, support_tickets: 1 },
    { customer_id: "c103", ad_clicks: 55, support_tickets: 4 },
    { customer_id: "c104", ad_clicks: 110, support_tickets: 0 },
  ];

  it("Step 1: Deterministically blends transaction and operational datasets", () => {
    const blend = BlendingEngine.blend({
      leftDatasetId: "tx_data",
      rightDatasetId: "ops_data",
      leftRows: transactions,
      rightRows: operationalMetrics,
      joinType: "INNER",
    });

    const rows = blend.rows || (blend as any).blendedRows;
    expect(rows.length).toBe(8);
    expect(rows[0]).toHaveProperty("amount");
    expect(rows[0]).toHaveProperty("ad_clicks");
    expect(rows[0]).toHaveProperty("support_tickets");
  });

  it("Step 2: Generates Holt-Winters seasonal forecast with strictly ordered confidence bounds", () => {
    const forecast = ForecastEngine.generateSeasonalForecast(
      "amount",
      "Transaction Revenue",
      transactions.map((t) => ({ period: t.period, value: t.amount })),
      4
    );

    expect(forecast.modelType).toBe("HOLT_WINTERS_ADDITIVE");
    expect(forecast.detectedPeriodicity).toBe(4);
    expect(forecast.points).toHaveLength(4);

    forecast.points.forEach((pt) => {
      expect(pt.lowerBound95!).toBeLessThanOrEqual(pt.lowerBound80!);
      expect(pt.lowerBound80!).toBeLessThanOrEqual(pt.projectedValue);
      expect(pt.projectedValue).toBeLessThanOrEqual(pt.upperBound80!);
      expect(pt.upperBound80!).toBeLessThanOrEqual(pt.upperBound95!);
    });
  });

  it("Step 3: Calculates OLS multi-variable regression with standardized betas and VIF bounds", () => {
    const multiDriverRows = [
      { amount: 120, ad_clicks: 45, support_tickets: 2 },
      { amount: 250, ad_clicks: 80, support_tickets: 1 },
      { amount: 180, ad_clicks: 55, support_tickets: 4 },
      { amount: 310, ad_clicks: 110, support_tickets: 0 },
      { amount: 140, ad_clicks: 50, support_tickets: 2 },
      { amount: 290, ad_clicks: 95, support_tickets: 1 },
    ];

    const regression = MultiDriverEngine.analyzeMultiVariableDrivers(
      "amount",
      ["ad_clicks", "support_tickets"],
      multiDriverRows
    );

    expect(regression.status).toBe("SUCCESS");
    expect(regression.drivers).toHaveLength(2);
    expect(regression.rSquared).toBeGreaterThan(0.8);
    expect(regression.drivers[0].vif).toBeLessThan(5);
  });

  it("Step 4: Orchestrator executes end-to-end multi-dataset predictive turn and returns structured evidence payload", async () => {
    const res = await CopilotOrchestrator.processTurn({
      userId: "user_e2e",
      datasets: [
        { id: "tx_data", name: "Transactions", rows: transactions },
        { id: "ops_data", name: "Operations", rows: operationalMetrics },
      ],
      prompt: "Blend transaction and operation data, then forecast the next 4 quarters of revenue.",
    });

    expect(res.analytical.available).toBe(true);
    expect(res.analytical.toolsExecuted).toContain("blend_datasets");
    expect(res.evidence.length).toBeGreaterThan(0);
    expect(res.status === "SUCCESS" || res.status === "DETERMINISTIC_FALLBACK").toBe(true);
  });
});

