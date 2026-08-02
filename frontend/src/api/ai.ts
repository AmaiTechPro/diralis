import { apiFetch } from "./apiClient";

export interface AIResponse {
  reply: string;
}

export function askAI(message: string) {
  return apiFetch<AIResponse>("/ai", {
    method: "POST",

    body: JSON.stringify({
      message,
    }),
  });
}

