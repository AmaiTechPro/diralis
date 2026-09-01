import { ChatMessage } from "@prisma/client";

const MAX_HISTORY_TURNS = 8;
const MAX_MESSAGE_CHAR_LIMIT = 4000;

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function assembleMultiTurnPrompt(
  systemPrompt: string,
  datasetOverview: string,
  mapContext: string,
  history: Pick<ChatMessage, "role" | "content">[],
  currentUserPrompt: string
): LLMMessage[] {
  const boundedHistory = history.slice(-MAX_HISTORY_TURNS).map((msg) => ({
    role: (msg.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
    content: msg.content.substring(0, MAX_MESSAGE_CHAR_LIMIT),
  }));

  return [
    { role: "system", content: systemPrompt },
    {
      role: "system",
      content: `### AUTHORITATIVE STATISTICAL / MAP CONTEXT (IMMUTABLE GROUND TRUTH):\n${datasetOverview}\n\n${mapContext}`,
    },
    ...boundedHistory,
    { role: "user", content: currentUserPrompt },
  ];
}


