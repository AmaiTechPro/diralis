import { describe, it, expect } from "vitest";
import { CopilotLogger } from "../services/copilot/copilotLogger";

describe("Phase 3.1 — Structured Observability Logger Suite", () => {
  it("1. Generates unique correlation IDs with standard prefix", () => {
    const id1 = CopilotLogger.createCorrelationId();
    const id2 = CopilotLogger.createCorrelationId();
    expect(id1.startsWith("cpl_")).toBe(true);
    expect(id1).not.toBe(id2);
  });

  it("2. Formats structured JSON log payloads correctly", () => {
    const correlationId = CopilotLogger.createCorrelationId();
    const payload = CopilotLogger.log(
      "DETERMINISTIC_TOOL_EXECUTED",
      { correlationId, userId: "user_test_1", datasetId: "ds_test_1" },
      { toolName: "compute_metric", status: "SUCCESS" },
      24
    );

    expect(payload.eventType).toBe("DETERMINISTIC_TOOL_EXECUTED");
    expect(payload.level).toBe("INFO");
    expect(payload.durationMs).toBe(24);
    expect(payload.context.correlationId).toBe(correlationId);
    expect(payload.context.userId).toBe("user_test_1");
    expect(payload.data?.toolName).toBe("compute_metric");
    expect(payload.timestamp).toBeDefined();
  });

  it("3. Captures warnings and errors with proper severity levels", () => {
    const payload = CopilotLogger.log(
      "FALLBACK_TRIGGERED",
      { userId: "user_test_2" },
      { reason: "PROVIDER_TIMEOUT" },
      undefined,
      "WARN"
    );

    expect(payload.level).toBe("WARN");
    expect(payload.eventType).toBe("FALLBACK_TRIGGERED");
    expect(payload.data?.reason).toBe("PROVIDER_TIMEOUT");
  });
});



