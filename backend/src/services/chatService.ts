import { parseDataset } from "./datasetFileService";

import { profileDataset } from "./profiler/profileDataset";

import { generateInsights } from "./insights/generateInsights";

import { generateReport } from "./report/reportGenerator";

import { getLatestDataset } from "./datasetService";

export async function generateChatResponse(
  userId: string,
  message: string
): Promise<string> {

  const latestDataset =
    await getLatestDataset(
      userId
    );

  if (!latestDataset) {

    return "You don't have any uploaded datasets yet. Upload a dataset first so I can analyze it.";

  }

  const rows =
    await parseDataset(
      latestDataset.id
    );

  const profile =
    profileDataset(
      rows
    );

  const insights =
    generateInsights(
      profile
    );

  const report =
    generateReport(
      profile,
      insights
    );

  const prompt =
    message.toLowerCase();

  if (
    prompt.includes("summary") ||
    prompt.includes("summarize")
  ) {

    return report.executiveSummary;

  }

  if (
    prompt.includes("health")
  ) {

    return `Business Health: ${report.businessHealth}%`;

  }

  if (
    prompt.includes("score")
  ) {

    return `Overall AI Score: ${report.aiScore}`;

  }

  if (
    prompt.includes("warning")
  ) {

    if (
      report.warnings.length === 0
    ) {

      return "No business warnings were detected.";

    }

    return report.warnings
      .map(warning => `• ${warning}`)
      .join("\n");

  }

  if (
    prompt.includes("recommend")
  ) {

    return report.recommendations
      .map(recommendation => `• ${recommendation}`)
      .join("\n");

  }

  if (
    prompt.includes("insight")
  ) {

    return report.insights
      .map(insight => `• ${insight}`)
      .join("\n");

  }

  return "I can currently answer questions about your executive summary, AI score, business health, insights, warnings and recommendations. Full conversational AI will be enabled when OpenAI or Gemini is connected.";

}

