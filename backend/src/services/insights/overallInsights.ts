import { analyzeRisks } from "./riskAnalyzer";

export interface OverallInsightsInput {
  datasets: {
    quality: number;
    insights: number;
    warnings: number;
    recommendations: string[];
  }[];
}

export function getOverallInsights({
  datasets,
}: OverallInsightsInput) {

  if (datasets.length === 0) {
    return {
      businessHealth: 0,
      aiScore: "N/A",
      confidenceScore: 0,
      totalInsights: 0,
      warnings: 0,
      summary:
        "No datasets have been analyzed yet.",
      recommendations: [
        "Upload a dataset to begin AI analysis.",
      ],
      risks: [],
      opportunities: [],
    };
  }

  const businessHealth = Math.round(
    datasets.reduce(
      (sum, d) => sum + d.quality,
      0
    ) / datasets.length
  );

  const totalInsights =
    datasets.reduce(
      (sum, d) => sum + d.insights,
      0
    );

  const warnings =
    datasets.reduce(
      (sum, d) => sum + d.warnings,
      0
    );

  const recommendations = [
    ...new Set(
      datasets.flatMap(
        d => d.recommendations
      )
    ),
  ].slice(0, 8);

  let aiScore = "C";

  if (businessHealth >= 95) {
    aiScore = "A+";
  } else if (businessHealth >= 90) {
    aiScore = "A";
  } else if (businessHealth >= 80) {
    aiScore = "B";
  }

  const confidenceScore =
    Math.max(
      0,
      Math.min(
        100,
        businessHealth - warnings * 5
      )
    );

  const risks = analyzeRisks(
    businessHealth,
    warnings
  );

  const opportunities: string[] = [];

  if (businessHealth >= 90) {
    opportunities.push(
      "Your datasets are ready for predictive AI modeling."
    );
  }

  if (totalInsights >= 10) {
    opportunities.push(
      "Sufficient analytical insights exist to support executive decision making."
    );
  }

  if (warnings === 0) {
    opportunities.push(
      "Excellent data quality enables high-confidence business intelligence."
    );
  }

  return {
    businessHealth,
    aiScore,
    confidenceScore,
    totalInsights,
    warnings,
    summary:
      `Diralis analyzed ${datasets.length} dataset(s) with an overall business health of ${businessHealth}%. ${totalInsights} AI insights and ${warnings} warning(s) were generated.`,
    recommendations,
    risks,
    opportunities,
  };
}

