import { ToolRegistry, ToolContext } from "./toolRegistry";
import { getAIProvider } from "../ai/providerFactory";

export interface CopilotRequest {
  userId: string;
  datasetId: string;
  prompt: string;
  rows?: Record<string, any>[];
  mapSummary: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface CopilotStructuredOutput {
  summary: string;
  insights: any[];
  recommendations: any[];
  deterministicEvidence: any[];
}

export class CopilotOrchestrator {
  public static async processTurn(req: CopilotRequest): Promise<CopilotStructuredOutput> {
    const rows = req.rows || [];
    const ctx: ToolContext = {
      userId: req.userId,
      datasetId: req.datasetId,
      rows,
    };

    // 1. Identify and execute relevant deterministic analytics based on user intent
    const lower = req.prompt.toLowerCase();
    const evidence: any[] = [];

    if (lower.includes("outlier") || lower.includes("anomaly") || lower.includes("unusual")) {
      // Trigger anomaly detection on available rows
      if (rows.length >= 4) {
        const firstRow = rows[0];
        const numericKeys = Object.keys(firstRow).filter((k) => typeof firstRow[k] === "number");
        if (numericKeys.length > 0) {
          const key = numericKeys[0];
          const points = rows.map((r, i) => ({ id: String(i), label: `Row ${i + 1}`, value: Number(r[key]) }));
          const anomalies = await ToolRegistry.executeTool("detect_anomalies", ctx, {
            metricId: key,
            metricName: key,
            dataPoints: points,
          });
          evidence.push({ tool: "detect_anomalies", result: anomalies });
        }
      }
    }

    // 2. Assemble bounded prompt with deterministic facts
    const evidenceText = evidence.length > 0
      ? `### DETERMINISTIC ANALYTICAL EVIDENCE:\n${JSON.stringify(evidence, null, 2)}`
      : "### NO SPECIFIC TOOL EVIDENCE TRIGGERED.";

    const messages = [
      {
        role: "system" as const,
        content: `You are the Diralis AI Business Copilot. Base all interpretations exclusively on the provided deterministic data and MAP context. Do not invent numbers.`,
      },
      {
        role: "system" as const,
        content: `### MAP CONTEXT:\n${req.mapSummary}\n\n${evidenceText}`,
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

    // 3. Invoke AI Provider
    const provider = getAIProvider();
    const responseText = await provider.generateCompletion({ messages });

    return {
      summary: responseText,
      insights: evidence.filter((e) => e.tool === "detect_anomalies").flatMap((e) => e.result),
      recommendations: [
        {
          title: "Monitor Primary Outliers",
          description: "Investigate flagged high-severity deviations in the dataset context.",
        },
      ],
      deterministicEvidence: evidence,
    };
  }
}

