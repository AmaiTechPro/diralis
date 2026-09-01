import { AIProvider } from "./types";
import { OpenAIProvider } from "./openAIProvider";
import { MockAIProvider } from "./mockProvider";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();

  if (provider === "mock" || process.env.NODE_ENV === "test" || !process.env.OPENAI_API_KEY) {
    return new MockAIProvider();
  }

  return new OpenAIProvider();
}


