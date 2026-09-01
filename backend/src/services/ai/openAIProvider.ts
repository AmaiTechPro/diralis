import OpenAI from "openai";
import { AIProvider, AICompletionOptions } from "./types";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "mock-key",
    });
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async generateCompletion(options: AICompletionOptions): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens ?? 1200,
      temperature: options.temperature ?? 0.2,
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      throw new Error("Received empty response from OpenAI provider.");
    }

    return reply;
  }
}


