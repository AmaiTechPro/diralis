export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  messages: AIChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  generateCompletion(options: AICompletionOptions): Promise<string>;
}


