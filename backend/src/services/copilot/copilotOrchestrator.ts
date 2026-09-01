import { ToolRegistry, ToolContext } from "./toolRegistry";
import { getAIProvider } from "../ai/providerFactory";
import {
  StructuredCopilotResponse,
  CopilotResponseStatus,
  AIProviderState,
} from "./responseSemantics";

export interface CopilotRequest {
  userId: string;
  datasetId: string;
  prompt: string;
  rows?: Record<string, any>[];
  mapSummary?: string;
  mapVersion?: number;
  history?: { role: "user" | "assistant"; content: string }[];
}

export class CopilotOrchestrator {
  public static async processTurn(
    req: CopilotRequest
  ): Promise<StructuredCopilotResponse> {
    const startTime = Date.now();
    const rows = req.rows || [];
    const ctx: ToolContext = {
      userId: req.userId,
      datasetId: req.datasetId,
      rows,
    };

    const evidence: any[] = [];
    const executedTools: string[] = [];
    const warnings: string[] = [];
    let analyticalAvailable = false;

    // 1. Check MAP Context Availability
    if (!req.mapSummary && rows.length === 0) {
      return {
        status: "MAP_UNAVAILABLE",
        summary:
          "Dataset analytical context is currently unavailable. Please re-profile or re-upload the dataset.",
        ai: {
          available: false,
          providerState: "UNAVAILABLE",
          source: "NONE",
          quotaConsumed: false,
        },
        analytical: {
          available: false,
          state: "UNAVAILABLE",
          toolsExecuted: [],
        },
        evidence: [],
        insights: [],
        recommendations: [],
        warnings: ["Dataset schema profile (MAP) is missing or unreadable."],
        retryable: false,
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Execute deterministic analytical tools based on prompt intent
    const lower = req.prompt.toLowerCase();
    try {
      if (
        lower.includes("outlier") ||
        lower.includes("anomaly") ||
        lower.includes("unusual")
      ) {
        if (rows.length >= 4) {
          const firstRow = rows[0];
          const numericKeys = Object.keys(firstRow).filter(
            (k) => typeof firstRow[k] === "number"
          );
          if (numericKeys.length > 0) {
            const key = numericKeys[0];
            const points = rows.map((r, i) => ({
              id: String(i),
              label: `Row ${i + 1}`,
              value: Number(r[key]),
            }));
            const anomalies = await ToolRegistry.executeTool(
              "detect_anomalies",
              ctx,
              {
                metricId: key,
                metricName: key,
                data: points, // <-- Aligned with ToolRegistry parameter
              }
            );
            evidence.push({ tool: "detect_anomalies", result: anomalies });
            executedTools.push("detect_anomalies");
            analyticalAvailable = true;
          }
        }
      }
    } catch (err: any) {
      warnings.push(`Tool execution error: ${err.message || "Failed to execute deterministic tool."}`);
    }

    // 3. Assemble bounded prompt
    const evidenceText =
      evidence.length > 0
        ? `### DETERMINISTIC ANALYTICAL EVIDENCE:\n${JSON.stringify(evidence, null, 2)}`
        : "### NO SPECIFIC TOOL EVIDENCE TRIGGERED.";

    const messages = [
      {
        role: "system" as const,
        content:
          "You are the Diralis AI Business Copilot. Base all interpretations exclusively on the provided deterministic data and MAP context. Do not invent numbers.",
      },
      {
        role: "system" as const,
        content: `### MAP CONTEXT:\n${req.mapSummary || "Provided Dataset Rows"}\n\n${evidenceText}`,
      },
      ...(req.history || []).slice(-6).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      {
        role: "user" as const,
        content: req.prompt,
      },
    ];

    // 4. Attempt AI Generation with Protected Fallback
    let aiResponseText = "";
    let providerState: AIProviderState = "AVAILABLE";
    let isAIAvailable = false;
    let finalStatus: CopilotResponseStatus = "SUCCESS";

    try {
      const provider = getAIProvider();
      aiResponseText = await provider.generateCompletion({ messages });
      isAIAvailable = true;
      finalStatus = "SUCCESS";
    } catch (error: any) {
      const errMsg = (error?.message || "").toLowerCase();
      if (errMsg.includes("timeout") || errMsg.includes("timed out")) {
        providerState = "TIMEOUT";
      } else if (errMsg.includes("rate") || errMsg.includes("429")) {
        providerState = "RATE_LIMITED";
      } else {
        providerState = "UNAVAILABLE";
      }

      // If we have deterministic evidence, degrade to DETERMINISTIC_FALLBACK
      if (evidence.length > 0 || analyticalAvailable) {
        finalStatus = "DETERMINISTIC_FALLBACK";
        aiResponseText =
          "AI interpretation is temporarily unavailable. Diralis generated this response directly from deterministic calculations.";
        warnings.push("AI provider unreachable; showing verified deterministic engine results.");
      } else {
        finalStatus = providerState === "TIMEOUT" ? "PROVIDER_TIMEOUT" : "PROVIDER_UNAVAILABLE";
        aiResponseText = "Diralis AI is temporarily unavailable. Please retry in a moment.";
        warnings.push("AI generation failed and no fallback analytical evidence was computed.");
      }
    }

    const durationMs = Date.now() - startTime;
    const detectedInsights = evidence
      .filter((e) => e.tool === "detect_anomalies")
      .flatMap((e) => e.result);

    return {
      status: finalStatus,
      summary: aiResponseText,
      ai: {
        available: isAIAvailable,
        providerState,
        source: isAIAvailable ? "LLM_SYNTHESIS" : (analyticalAvailable ? "DETERMINISTIC_ENGINE" : "NONE"),
        quotaConsumed: isAIAvailable,
        latencyMs: durationMs,
      },
      analytical: {
        available: analyticalAvailable || !!req.mapSummary,
        state: analyticalAvailable ? "AVAILABLE" : (req.mapSummary ? "AVAILABLE" : "INSUFFICIENT_DATA"),
        mapVersion: req.mapVersion || 1,
        toolsExecuted: executedTools,
      },
      evidence,
      insights: detectedInsights,
      recommendations: isAIAvailable
        ? [{ title: "Review Key Findings", description: "Follow up on highlighted dataset insights." }]
        : [],
      warnings,
      retryable: finalStatus === "PROVIDER_TIMEOUT" || finalStatus === "PROVIDER_UNAVAILABLE" || finalStatus === "DETERMINISTIC_FALLBACK",
      timestamp: new Date().toISOString(),
    };
  }
}

