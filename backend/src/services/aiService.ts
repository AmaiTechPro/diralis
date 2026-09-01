import { DIRALIS_SYSTEM_PROMPT } from "../ai/prompts";
import { getAIProvider } from "./ai/providerFactory";
import { buildDatasetContext, buildMAPContext } from "./contextService";

export interface AskDiralisOptions {
  userId: string;
  message: string;
  datasetId?: string;
}

export async function askDiralis({
  userId,
  message,
  datasetId,
}: AskDiralisOptions): Promise<string> {
  // 1. Retrieve tenant-scoped dataset and MAP context
  const datasetContext = await buildDatasetContext(userId, datasetId);
  const mapContext = await buildMAPContext(userId, datasetId);

  // 2. Obtain active provider instance (OpenAI or Mock)
  const provider = getAIProvider();

  // 3. Generate grounded completion
  const reply = await provider.generateCompletion({
    messages: [
      {
        role: "system",
        content: DIRALIS_SYSTEM_PROMPT,
      },
      {
        role: "system",
        content: `DATASET OVERVIEW:\n${datasetContext}\n\nACTIVE MAP CONTEXT:\n${mapContext}`,
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  return reply;
}
