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

  // Deterministic baseline calculations (Milestone 5.2, Section 21)
  let summary = `Diralis analyzed ${datasets.length} dataset(s) with an overall business health score of ${businessHealth}%. Aggregated across all sources, ${totalInsights} analytical insights and ${warnings} operational warning(s) were observed.`;
  
  let recommendations = [
    ...new Set(datasets.flatMap(d => d.recommendations)),
  ].slice(0, 6);

  let opportunities: string[] = [];
  if (businessHealth >= 90) {
    opportunities.push("High dataset integrity enables reliable downstream machine learning forecasts.");
  }
  if (totalInsights >= 10) {
    opportunities.push("Sufficient multi-metric depth exists to support autonomous decision scoring.");
  }
  if (warnings === 0) {
    opportunities.push("Zero data quality warnings recorded, maximizing statistical confidence in KPI tracking.");
  }
  if (opportunities.length === 0) {
    opportunities.push("Standardize data collection frequency to uncover high-confidence growth opportunities.");
  }

  // Grounded OpenAI Synthesis (Milestone 5.2, Section 1 & 8)
  try {
    const aiProvider = getAIProvider();

    const evidencePackage = {
      totalDatasets: datasets.length,
      averageHealthScore: businessHealth,
      totalInsightsObserved: totalInsights,
      totalWarningsIdentified: warnings,
      identifiedRisks: risks.slice(0, 3),
      candidateRecommendations: recommendations.slice(0, 5),
    };

    const prompt = `You are an elite retail analytics executive. Synthesize this portfolio of ingested business datasets into concise executive intelligence.

GROUNDING RULES:
1. Rely strictly on the numbers and metrics in the evidence package.
2. Do NOT invent new business statistics, external competitors, or imaginary revenue numbers.
3. Keep the tone sharp, factual, and decision-oriented.

Evidence Package:
${JSON.stringify(evidencePackage, null, 2)}

Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "A 2-sentence executive assessment of portfolio-wide data health, analytical readiness, and operational risk.",
  "opportunities": [
    "Specific opportunity grounded in the health score and insight count.",
    "Strategic leverage opportunity based on available analytical depth."
  ],
  "recommendations": [
    "Prioritized strategic recommendation 1 derived from data evidence.",
    "Prioritized strategic recommendation 2 focusing on operational improvement."
  ]
}`;

    const completion = await aiProvider.generateCompletion({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 450,
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
    console.warn("[overallInsights] OpenAI synthesis skipped, utilizing deterministic baseline:", (err as Error).message);
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


