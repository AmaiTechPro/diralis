export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  messages: AIChatMessage[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "json_object" | "text";
}

export interface AIProvider {
  generateCompletion(options: AICompletionOptions): Promise<string>;
}


