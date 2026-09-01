import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import { CopilotOrchestrator } from "../services/copilot/copilotOrchestrator";
import { ProactiveAnalysisService } from "../services/copilot/proactiveAnalysisService";
import * as providerFactory from "../services/ai/providerFactory";

describe("Phase 3.1 — Fallback States & Status Semantics Suite", () => {
  beforeAll(() => {
    process.env.AI_PROVIDER = "mock";
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("1. Returns SUCCESS with LLM_SYNTHESIS and consumes quota when AI succeeds", async () => {
    const res = await CopilotOrchestrator.processTurn({
      userId: "u_1",
      datasetId: "d_1",
      prompt: "Summarize the revenue distributions.",
      mapSummary: "Revenue mean: 500, stdDev: 40.",
    });

    expect(res.status).toBe("SUCCESS");
    expect(res.ai.available).toBe(true);
    expect(res.ai.source).toBe("LLM_SYNTHESIS");
    expect(res.ai.quotaConsumed).toBe(true);
    expect(res.retryable).toBe(false);
  });

  it("2. Returns DETERMINISTIC_FALLBACK and DOES NOT consume quota when AI fails but deterministic data exists", async () => {
    jest.spyOn(providerFactory, "getAIProvider").mockReturnValue({
      generateCompletion: jest.fn().mockImplementation(() => Promise.reject(new Error("AI Provider upstream timeout"))),
    } as any);

    const res = await CopilotOrchestrator.processTurn({
      userId: "u_1",
      datasetId: "d_1",
      prompt: "Check for any outlier or anomaly in the metrics.",
      rows: [{ cost: 10 }, { cost: 11 }, { cost: 12 }, { cost: 13 }, { cost: 150 }],
      mapSummary: "Cost metrics available.",
    });

    expect(res.status).toBe("DETERMINISTIC_FALLBACK");
    expect(res.ai.available).toBe(false);
    expect(res.ai.source).toBe("DETERMINISTIC_ENGINE");
    expect(res.ai.quotaConsumed).toBe(false);
    expect(res.evidence.length).toBeGreaterThan(0);
    expect(res.insights.length).toBeGreaterThan(0);
    expect(res.retryable).toBe(true);
  });

  it("3. Returns PROVIDER_UNAVAILABLE when AI fails and no deterministic analytics apply", async () => {
    jest.spyOn(providerFactory, "getAIProvider").mockReturnValue({
      generateCompletion: jest.fn().mockImplementation(() => Promise.reject(new Error("Provider down"))),
    } as any);

    const res = await CopilotOrchestrator.processTurn({
      userId: "u_1",
      datasetId: "d_1",
      prompt: "What is your strategic opinion on market trends?",
      mapSummary: "Some context.",
    });

    expect(res.status).toBe("PROVIDER_UNAVAILABLE");
    expect(res.ai.available).toBe(false);
    expect(res.ai.quotaConsumed).toBe(false);
    expect(res.retryable).toBe(true);
  });

  it("4. Returns MAP_UNAVAILABLE when analytical context and dataset rows are missing", async () => {
    const res = await CopilotOrchestrator.processTurn({
      userId: "u_1",
      datasetId: "d_1",
      prompt: "Analyze my dataset.",
      rows: [],
      mapSummary: undefined,
    });

    expect(res.status).toBe("MAP_UNAVAILABLE");
    expect(res.ai.available).toBe(false);
    expect(res.analytical.available).toBe(false);
    expect(res.retryable).toBe(false);
  });

  it("5. Proactive pipeline explicitly distinguishes NO_ANOMALIES from INSUFFICIENT_DATA and ANALYSIS_FAILED", async () => {
    const resInsufficient = await ProactiveAnalysisService.analyzeDataset("u_1", "d_1", [{ a: 1 }]);
    expect(resInsufficient.status).toBe("INSUFFICIENT_DATA");

    const normalRows = [
      { sales: 100 },
      { sales: 100 },
      { sales: 100 },
      { sales: 100 },
      { sales: 100 },
    ];
    const resNoAnomalies = await ProactiveAnalysisService.analyzeDataset("u_1", "d_1", normalRows);
    expect(resNoAnomalies.status).toBe("NO_ANOMALIES_DETECTED");
    expect(resNoAnomalies.insightsCreated).toBe(0);
  });
});

