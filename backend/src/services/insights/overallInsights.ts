import { analyzeRisks } from "./riskAnalyzer";
import { getAIProvider } from "../ai/providerFactory";

export interface OverallInsightsInput {
  datasets: {
    name?: string;
    quality: number;
    insights: number;
    warnings: number;
    recommendations: string[];
  }[];
}

export async function getOverallInsights({
  datasets,
}: OverallInsightsInput) {
  if (datasets.length === 0) {
    return {
      businessHealth: 0,
      aiScore: "N/A",
      confidenceScore: 0,
      totalInsights: 0,
      warnings: 0,
      summary: "No datasets have been analyzed yet.",
      recommendations: [
        "Upload a dataset or connect a POS store to begin AI analysis.",
      ],
      risks: [],
      opportunities: [],
    };
  }

  const businessHealth = Math.round(
    datasets.reduce((sum, d) => sum + d.quality, 0) / datasets.length
  );

  const totalInsights = datasets.reduce((sum, d) => sum + d.insights, 0);
  const warnings = datasets.reduce((sum, d) => sum + d.warnings, 0);

  let aiScore = "C";
  if (businessHealth >= 95) {
    aiScore = "A+";
  } else if (businessHealth >= 90) {
    aiScore = "A";
  } else if (businessHealth >= 80) {
    aiScore = "B";
  }

  const confidenceScore = Math.max(
    0,
    Math.min(100, businessHealth - warnings * 5)
  );

  const risks = analyzeRisks(businessHealth, warnings);

  // Extract real ingested dataset names and specific computed recommendations
  const datasetNames = datasets
    .map((d) => d.name)
    .filter(Boolean)
    .join(", ") || "Active Dataset";

  const extractedRecs = [
    ...new Set(datasets.flatMap((d) => d.recommendations)),
  ].filter(Boolean);

  // Real data-grounded baseline calculations
  let summary = `Analyzed ${datasets.length} dataset(s) (${datasetNames}) with an aggregate health score of ${businessHealth}%. Discovered ${totalInsights} domain metric insight(s) and flagged ${warnings} data issue(s).`;

  let recommendations = extractedRecs.length > 0
    ? extractedRecs.slice(0, 5)
    : [
        `Maintain continuous ingestion on ${datasetNames} to stabilize statistical trends.`,
        `Address ${warnings} detected data quality anomaly/anomalies to improve scoring reliability.`,
      ];

  let opportunities: string[] = [];
  if (extractedRecs.length > 2) {
    opportunities.push(
      `Dataset profiles indicate actionable variance in key operational metrics across ${datasetNames}.`
    );
  }
  if (businessHealth >= 80) {
    opportunities.push(
      `High sample integrity (${businessHealth}%) supports automated KPI anomaly detection and forecasting.`
    );
  }
  if (opportunities.length === 0) {
    opportunities.push(
      `Expand observation volume in ${datasetNames} to unlock deeper automated cross-metric correlations.`
    );
  }

  // Attempt live LLM synthesis
  try {
    const aiProvider = getAIProvider();

    const evidencePackage = {
      datasets: datasets.map((d) => ({
        name: d.name,
        qualityScore: d.quality,
        insightsCount: d.insights,
        warningCount: d.warnings,
        keyObservations: d.recommendations.slice(0, 3),
      })),
      aggregateHealth: businessHealth,
      totalInsights,
      totalWarnings: warnings,
      identifiedRisks: risks.slice(0, 3),
    };

    const prompt = `You are a senior data and retail intelligence analyst. Synthesize the provided ingested business datasets into executive intelligence.

GROUNDING RULES:
1. Base all observations strictly on the datasets and numbers provided in the evidence package.
2. Reference the real dataset name(s) and metrics directly.
3. Do not invent external data, fictitious brand names, or imaginary numbers.

Evidence Package:
${JSON.stringify(evidencePackage, null, 2)}

Respond ONLY with valid JSON:
{
  "summary": "2-sentence executive assessment mentioning specific dataset health and metrics.",
  "opportunities": [
    "Opportunity grounded in the dataset metrics.",
    "Strategic leverage opportunity based on observed trends."
  ],
  "recommendations": [
    "Prioritized actionable recommendation based on data evidence.",
    "Operational recommendation based on data findings."
  ]
}`;

    const completion = await aiProvider.generateCompletion({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1000,
      temperature: 0.2,
    });

    const cleanJson = completion.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed.summary && typeof parsed.summary === "string") {
      summary = parsed.summary;
    }
    if (Array.isArray(parsed.opportunities) && parsed.opportunities.length > 0) {
      opportunities = parsed.opportunities;
    }
    if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
      recommendations = parsed.recommendations;
    }
  } catch (err) {
    console.warn(
      "[overallInsights] Live AI synthesis bypassed, serving grounded data fallback:",
      (err as Error).message
    );
  }

  return {
    businessHealth,
    aiScore,
    confidenceScore,
    totalInsights,
    warnings,
    summary,
    recommendations,
    risks,
    opportunities,
  };
}


