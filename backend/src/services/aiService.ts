import openai from "../ai/openai";
import { DIRALIS_SYSTEM_PROMPT } from "../ai/prompts";
import { buildDatasetContext } from "./contextService";
import { getLatestDatasetContext } from "./datasetContextService";
import { getAnalyticsContext } from "./analyticsContextService";
import { getPredictionContext } from "./predictionContextService";
import { getRecommendationContext } from "./recommendationContextService";




export async function askDiralis(message: string) {
  const datasetContext =
        await buildDatasetContext();

  const latestDataset =
        await getLatestDatasetContext();

  const analyticsContext =
        await getAnalyticsContext();

  const predictionContext =
        await getPredictionContext();

  const recommendationContext =
        await getRecommendationContext();

  const response =
    await openai.responses.create({
      model: "gpt-5.5",

      input: [
        {
          role: "system",
          content: DIRALIS_SYSTEM_PROMPT,
        },
        {
          role: "system",
          content: datasetContext,
        },
        {
          role: "system",
          content: latestDataset,
        },

        {
        role: "system",
        content: analyticsContext,
        },

        {
        role: "system",
        content: predictionContext,
        },

        {
         role: "system",
         content: recommendationContext,
        },

        {
          role: "user",
          content: message,
        },
      ],
    });

  return response.output_text;
}

