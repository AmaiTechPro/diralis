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

    return `[Mock Diralis Analysis]: Based on the structured dataset metadata provided, your metrics demonstrate standard operational distribution. Actionable next steps include monitoring key numeric dimensions and optimizing categorical variances.`;
  }
}


