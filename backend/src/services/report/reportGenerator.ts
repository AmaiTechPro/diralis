import { DatasetProfile } from "../../types/profile";
import { getAIProvider } from "../ai/providerFactory";

export interface ReportData {
  executiveSummary: string;
  title: string;
  generatedAt: string;
  summary: string;
  dataset?: {
    name: string;
    rows: number;
    columns: number;
  };
  businessHealth: number;
  qualityIssues: string[];
  aiScore: string;
  insights: string[];
  warnings: string[];
  recommendations: string[];
}

interface GeneratedInsights {
  summary: string;
  quality: string[];
  anomalies: string[];
  business: string[];
  forecast: string[];
  kpis: string[];
  rootCauses: string[];
}

export async function generateReport(
  profile: DatasetProfile,
  insights: GeneratedInsights,
  datasetName = "Uploaded Dataset"
): Promise<ReportData> {
  const score = profile.quality.score;

  let aiScore = "C";
  if (score >= 90) aiScore = "A+";
  else if (score >= 80) aiScore = "A";
  else if (score >= 70) aiScore = "B";

  // Deterministic fallback values (Milestone 5.2, Section 21)
  let executiveSummary = `Diralis analyzed ${profile.rows} records across ${profile.columns} columns for '${datasetName}'. Dataset quality achieved a health score of ${score}%.`;

  let recommendations: string[] = [];
  if (profile.quality.issues && profile.quality.issues.length > 0) {
    recommendations.push(
      `Address identified quality issues: ${profile.quality.issues.slice(0, 2).join("; ")}.`
    );
  }
  if (
    insights.anomalies.length > 0 &&
    !insights.anomalies[0].toLowerCase().includes("no anomaly")
  ) {
    recommendations.push(`Investigate flagged outliers: ${insights.anomalies[0]}`);
  }
  if (
    insights.kpis.length > 0 &&
    !insights.kpis[0].toLowerCase().includes("no dominant")
  ) {
    recommendations.push(
      `Establish tracking thresholds for key metrics: ${insights.kpis[0]}`
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Maintain standard data hygiene and monitor ongoing metric distributions."
    );
  }

  // OpenAI Grounded Synthesis (Milestone 5.2, Section 1, 8 & 16)
  try {
    const aiProvider = getAIProvider();

    // Assemble runtime deterministic evidence package
    const evidencePackage = {
      datasetName,
      rows: profile.rows,
      columns: profile.columns,
      qualityScore: score,
      numericColumns: profile.numericColumns,
      categoricalColumns: profile.categoricalColumns,
      dateColumns: profile.dateColumns,
      keyStatistics: profile.statistics
        ? Object.entries(profile.statistics)
            .slice(0, 6)
            .map(([col, stats]) => ({
              column: col,
              mean: stats.mean,
              min: stats.min,
              max: stats.max,
              standardDeviation: stats.standardDeviation,
            }))
        : [],
      observedInsights: [
        ...insights.business.slice(0, 3),
        ...insights.kpis.slice(0, 3),
      ],
      observedWarnings: [
        ...insights.quality.slice(0, 2),
        ...insights.anomalies.slice(0, 2),
      ],
    };

    console.log(
      `[reportGenerator] Dispatching evidence package to AI (${datasetName}, ${profile.rows} rows, score: ${score}%)...`
    );

    const prompt = `You are an elite retail and business intelligence analyst. Generate an executive summary and strategic recommendations based STRICTLY on the supplied evidence package.

NON-NEGOTIABLE GROUNDING RULES:
1. Rely ONLY on the numbers and column facts provided in the evidence package.
2. NEVER invent new metrics, currency amounts, dates, or business events.
3. Every recommendation must directly reference a metric, distribution, or anomaly from the evidence.
4. If evidence is limited, state the limitation clearly.

Evidence Package:
${JSON.stringify(evidencePackage, null, 2)}

Respond ONLY with a valid JSON object matching this exact schema:
{
  "executiveSummary": "A concise, professional 3-sentence executive summary evaluating overall business performance, key driver trends, and data integrity based on the evidence.",
  "recommendations": [
    "Actionable recommendation 1 grounded in specific columns or metrics.",
    "Actionable recommendation 2 addressing margin, volume, or variability.",
    "Actionable recommendation 3 on operational optimization or anomaly mitigation.",
    "Actionable recommendation 4 on monitoring or strategic next steps."
  ]
}`;

    const completion = await aiProvider.generateCompletion({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 500,
      temperature: 0.2,
    });

    console.log("[reportGenerator] OpenAI synthesis response received successfully.");

    const cleanJson = completion.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed.executiveSummary && typeof parsed.executiveSummary === "string") {
      executiveSummary = parsed.executiveSummary;
    }
    if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
      recommendations = parsed.recommendations;
    }
  } catch (err) {
    console.warn(
      "[reportGenerator] OpenAI synthesis skipped, utilizing deterministic fallback:",
      (err as Error).message
    );
  }

  return {
    title: "Diralis Executive Business Report",
    generatedAt: new Date().toISOString(),
    executiveSummary,
    summary: insights.summary,
    dataset: {
      name: datasetName,
      rows: profile.rows,
      columns: profile.columns,
    },
    businessHealth: score,
    qualityIssues: profile.quality.issues ?? [],
    aiScore,
    insights: [
      ...insights.business,
      ...insights.forecast,
      ...insights.kpis,
    ],
    warnings: [
      ...insights.quality,
      ...insights.anomalies,
      ...insights.rootCauses,
    ],
    recommendations,
  };
}


