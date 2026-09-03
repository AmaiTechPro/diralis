import { AIProvider, AICompletionOptions } from "./types";

export class MockAIProvider implements AIProvider {
  async generateCompletion(options: AICompletionOptions): Promise<string> {
    const userMessage = options.messages.find((m) => m.role === "user")?.content || "";

    if (userMessage.includes("__SIMULATE_TIMEOUT__")) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      throw new Error("Provider timeout simulated.");
    }

    if (userMessage.includes("__SIMULATE_FAILURE__")) {
      throw new Error("Simulated upstream provider outage.");
    }

    // Check if caller expects a JSON object payload
    const expectsJson =
      userMessage.toLowerCase().includes("json") ||
      options.messages.some((m) => m.content.toLowerCase().includes("json"));

    if (expectsJson) {
      // Check for reportGenerator vs overallInsights schema markers
      if (userMessage.includes("executiveSummary") || userMessage.includes("businessHealth")) {
        return JSON.stringify({
          executiveSummary:
            "Automated development environment analysis: dataset ingested and profiled with standard metric distribution across identified dimensions.",
          insights: [
            "Primary numerical series exhibit stable variance across active records.",
            "Distribution bounds indicate consistent operational metrics.",
          ],
          recommendations: [
            "Maintain consistent periodic dataset ingestion for ongoing trend analysis.",
            "Monitor outlier columns to preserve baseline reporting accuracy.",
          ],
        });
      }

      if (userMessage.includes("opportunities") && userMessage.includes("recommendations")) {
        return JSON.stringify({
          summary:
            "Multi-dataset development summary: Ingested tenant datasets reflect steady baseline data health with active analytical tracking.",
          opportunities: [
            "Leverage consistent schema patterns to expand automated forecasting coverage.",
            "Establish recurring syncs to monitor time-series momentum.",
          ],
          recommendations: [
            "Standardize primary identifier columns across related data tables.",
            "Review zero-variance columns prior to running predictive regressions.",
          ],
        });
      }

      return JSON.stringify({
        summary: "Standard operational distribution confirmed across verified dataset attributes.",
        recommendations: [
          "Continue monitoring active telemetry streams.",
          "Track column anomalies during next ingestion cycle.",
        ],
      });
    }

    return `[Mock Diralis Analysis]: Based on the structured dataset metadata provided, your metrics demonstrate standard operational distribution. Actionable next steps include monitoring key numeric dimensions and optimizing categorical variances.`;
  }
}


