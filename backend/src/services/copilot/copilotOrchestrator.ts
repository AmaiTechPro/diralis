import { ToolRegistry, ToolContext } from "./toolRegistry";
import { getAIProvider } from "../ai/providerFactory";
import {
  StructuredCopilotResponse,
  CopilotResponseStatus,
  AIProviderState,
} from "./responseSemantics";
import { ContextService, DatasetProfileSummary } from "./contextService";

export interface DatasetInput {
  id: string;
  name: string;
  rows: Record<string, any>[];
  columns?: { name: string; type: string }[];
}

export interface CopilotRequest {
  userId: string;
  datasetId?: string;
  datasets?: DatasetInput[];
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
    const evidence: any[] = [];
    const executedTools: string[] = [];
    const warnings: string[] = [];
    let analyticalAvailable = false;

    // 1. Resolve Active Rows and Multi-Dataset Inputs
    let activeRows: Record<string, any>[] = req.rows || [];
    const activeDatasets = req.datasets || [];

    if (activeRows.length === 0 && activeDatasets.length > 0) {
      activeRows = activeDatasets[0].rows;
    }

    const primaryDatasetId = req.datasetId || (activeDatasets[0]?.id ?? "default_dataset");

    // 2. Synthesize Composite MAP Context if multi-datasets provided
    let compositeContextString = req.mapSummary || "";
    if (activeDatasets.length > 0) {
      const profiles: DatasetProfileSummary[] = activeDatasets.map((d) => ({
        id: d.id,
        name: d.name,
        rowCount: d.rows.length,
        columns:
          d.columns ||
          (d.rows[0]
            ? Object.keys(d.rows[0]).map((k) => ({
                name: k,
                type: typeof d.rows[0][k],
              }))
            : []),
      }));

      const composite = ContextService.buildCompositeMAPContext(profiles);
      compositeContextString = composite.formattedContextString;
    }

    // Guard: Check MAP / Row Context Availability
    if (!compositeContextString && activeRows.length === 0) {
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

    const ctx: ToolContext = {
      userId: req.userId,
      datasetId: primaryDatasetId,
      rows: activeRows,
    };

    const lower = req.prompt.toLowerCase();

    // 3. Deterministic Routing Logic
    try {
      // Route A: Cross-Dataset Blending
      if (
        activeDatasets.length >= 2 &&
        (lower.includes("blend") ||
          lower.includes("join") ||
          lower.includes("combine") ||
          lower.includes("merge") ||
          lower.includes("across"))
      ) {
        const blendResult = await ToolRegistry.executeTool("blend_datasets", ctx, {
          leftRows: activeDatasets[0].rows,
          rightRows: activeDatasets[1].rows,
          rightDatasetId: activeDatasets[1].id,
          joinType: "INNER",
        });

        evidence.push({ tool: "blend_datasets", result: blendResult });
        executedTools.push("blend_datasets");
        activeRows = blendResult.blendedRows;
        ctx.rows = activeRows;
        analyticalAvailable = true;
      }

      // Route B: Seasonal Forecasting (Holt-Winters / Trend)
      if (
        lower.includes("forecast") ||
        lower.includes("predict") ||
        lower.includes("projection") ||
        lower.includes("next quarter") ||
        lower.includes("future")
      ) {
        if (activeRows.length >= 2) {
          const firstRow = activeRows[0];
          const keys = Object.keys(firstRow);
          const dateKey = keys.find((k) => /date|time|period|quarter|month|year/i.test(k)) || keys[0];
          const numKey = keys.find((k) => typeof firstRow[k] === "number" && k !== dateKey) || keys[1];

          if (dateKey && numKey) {
            const series = activeRows.map((r) => ({
              period: String(r[dateKey]),
              value: Number(r[numKey]),
            }));

            const forecast = await ToolRegistry.executeTool(
              "generate_seasonal_forecast",
              ctx,
              {
                metricId: numKey,
                metricName: numKey,
                historicalData: series,
                periodsToForecast: 4,
              }
            );

            evidence.push({ tool: "generate_seasonal_forecast", result: forecast });
            executedTools.push("generate_seasonal_forecast");
            analyticalAvailable = true;
          }
        }
      }

      // Route C: Multi-Variable OLS Regression Drivers
      if (
        lower.includes("driver") ||
        lower.includes("influence") ||
        lower.includes("impact") ||
        lower.includes("regression") ||
        lower.includes("multivariable")
      ) {
        if (activeRows.length >= 4) {
          const firstRow = activeRows[0];
          const numericKeys = Object.keys(firstRow).filter((k) => typeof firstRow[k] === "number");

          if (numericKeys.length >= 2) {
            const target = numericKeys[0];
            const features = numericKeys.slice(1);

            const regression = await ToolRegistry.executeTool(
              "analyze_multivariable_drivers",
              ctx,
              {
                targetName: target,
                featureNames: features,
                rows: activeRows,
              }
            );

            evidence.push({ tool: "analyze_multivariable_drivers", result: regression });
            executedTools.push("analyze_multivariable_drivers");
            analyticalAvailable = true;
          }
        }
      }

      // Route D: Anomaly Outlier Detection
      if (
        lower.includes("outlier") ||
        lower.includes("anomaly") ||
        lower.includes("unusual")
      ) {
        if (activeRows.length >= 4) {
          const firstRow = activeRows[0];
          const numericKeys = Object.keys(firstRow).filter(
            (k) => typeof firstRow[k] === "number"
          );
          if (numericKeys.length > 0) {
            const key = numericKeys[0];
            const points = activeRows.map((r, i) => ({
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
                data: points,
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

    // 4. Assemble Bounded Prompt
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
        content: `### MAP CONTEXT:\n${compositeContextString || "Provided Dataset Rows"}\n\n${evidenceText}`,
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

    // 5. Attempt AI Generation with Protected Fallback
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
        source: isAIAvailable
          ? "LLM_SYNTHESIS"
          : analyticalAvailable
          ? "DETERMINISTIC_ENGINE"
          : "NONE",
        quotaConsumed: isAIAvailable,
        latencyMs: durationMs,
      },
      analytical: {
        available: analyticalAvailable || !!compositeContextString,
        state: analyticalAvailable
          ? "AVAILABLE"
          : compositeContextString
          ? "AVAILABLE"
          : "INSUFFICIENT_DATA",
        mapVersion: req.mapVersion || 1,
        toolsExecuted: executedTools,
      },
      evidence,
      insights: detectedInsights,
      recommendations: isAIAvailable
        ? [{ title: "Review Key Findings", description: "Follow up on highlighted dataset insights." }]
        : [],
      warnings,
      retryable:
        finalStatus === "PROVIDER_TIMEOUT" ||
        finalStatus === "PROVIDER_UNAVAILABLE" ||
        finalStatus === "DETERMINISTIC_FALLBACK",
      timestamp: new Date().toISOString(),
    };
  }
}


