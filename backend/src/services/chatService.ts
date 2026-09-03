import { parseDataset } from "./datasetFileService";
import { profileDataset } from "./profiler/profileDataset";
import { generateInsights } from "./insights/generateInsights";
import { generateReport } from "./report/reportGenerator";
import { getLatestDataset } from "./datasetService";
import { getAIProvider } from "./ai/providerFactory";

export async function generateChatResponse(
  userId: string,
  message: string
): Promise<string> {
  const latestDataset = await getLatestDataset(userId);

  if (!latestDataset) {
    return "You don't have any uploaded datasets yet. Please upload a dataset or connect your store so I can analyze it.";
  }

  const rows = await parseDataset(latestDataset.id);
  const profile = profileDataset(rows);
  const insights = generateInsights(profile);
  const report = await generateReport(
    profile,
    insights,
    latestDataset.originalName
  );

  const prompt = message.toLowerCase();

  // Fast deterministic paths for exact keyword matches
  if (prompt.includes("summary") || prompt.includes("summarize")) {
    return report.executiveSummary;
  }

  if (prompt.includes("health")) {
    return `Business Health Score: ${report.businessHealth}%`;
  }

  if (prompt.includes("score")) {
    return `Overall AI Performance Grade: ${report.aiScore} (Calculated Health: ${report.businessHealth}%)`;
  }

  if (prompt.includes("warning")) {
    if (!report.warnings || report.warnings.length === 0) {
      return "No data hygiene or operational warnings were detected for this dataset.";
    }
    return report.warnings.map((warning: string) => `• ${warning}`).join("\n");
  }

  if (prompt.includes("recommend")) {
    if (!report.recommendations || report.recommendations.length === 0) {
      return "No specific recommendations generated. Maintain current transaction tracking.";
    }
    return report.recommendations
      .map((recommendation: string) => `• ${recommendation}`)
      .join("\n");
  }

  if (prompt.includes("insight")) {
    if (!report.insights || report.insights.length === 0) {
      return "No significant business signals detected in the available dataset.";
    }
    return report.insights.map((insight: string) => `• ${insight}`).join("\n");
  }

  // Grounded conversational fallback via real AI Provider (Milestone 5.2, Section 1 & 17)
  try {
    const aiProvider = getAIProvider();

    const groundedContext = {
      datasetName: latestDataset.originalName,
      rows: profile.rows,
      columns: profile.columns,
      businessHealth: report.businessHealth,
      aiScore: report.aiScore,
      executiveSummary: report.executiveSummary,
      insights: report.insights.slice(0, 5),
      warnings: report.warnings.slice(0, 3),
      recommendations: report.recommendations.slice(0, 4),
    };

    const completion = await aiProvider.generateCompletion({
      messages: [
        {
          role: "system",
          content: `You are the Diralis Executive AI Assistant. Answer the merchant's question using ONLY the provided deterministic business context. 
GROUNDING RULES:
1. Never invent revenue numbers, dates, products, or metrics not listed in the context.
2. If the user asks about data not available in the context, explicitly state: "That information is not available in the current dataset."
3. Keep answers direct, professional, and concise.

Context:
${JSON.stringify(groundedContext, null, 2)}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      maxTokens: 350,
      temperature: 0.2,
    });

    return completion.trim();
  } catch (error) {
    console.warn("[chatService] AI fallback generation failed:", (error as Error).message);
    return `I analyzed '${latestDataset.originalName}' (${profile.rows} records, health score: ${report.businessHealth}%). You can ask me about executive summary, business health, insights, warnings, or recommendations.`;
  }
}


