import { AIProvider } from "./types";
import { OpenAIProvider } from "./openAIProvider";
import { MockAIProvider } from "./mockProvider";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  const isTestEnv = process.env.NODE_ENV === "test";
  const isProduction = process.env.NODE_ENV === "production";

  // Explicit mock requested or isolated test runner
  if (provider === "mock" || isTestEnv) {
    return new MockAIProvider();
  }

  // Strict check: Prevent silent fake analytics in production
  if (!process.env.OPENAI_API_KEY) {
    if (isProduction) {
      console.error(
        "[AIProviderFactory] CRITICAL: OPENAI_API_KEY is not configured in production. Grounded LLM synthesis is disabled."
      );
      throw new Error(
        "AI provider is not configured. Real OpenAI credentials are required for generative analytics."
      );
    }

    console.warn(
      "[AIProviderFactory] OPENAI_API_KEY is missing in development mode. Falling back to MockAIProvider."
    );
    return new MockAIProvider();
  }

  return new OpenAIProvider();
}


