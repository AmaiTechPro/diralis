import { CorrelationResult, NumericStatistics } from "../../types/profile";

export function generateKpiInsights(
  statistics: Record<string, NumericStatistics>,
  correlations: CorrelationResult[]
): string[] {

  const insights: string[] = [];

  for (const [column, stats] of Object.entries(statistics)) {

    const variation =
      stats.mean === 0
        ? 0
        : stats.standardDeviation / stats.mean;

    const relationships =
      correlations.filter(
        correlation =>
          correlation.columnA === column ||
          correlation.columnB === column
      );

    const strongRelationships =
      relationships.filter(
        correlation =>
          Math.abs(correlation.coefficient) >= 0.7
      );

    if (strongRelationships.length >= 2) {

      insights.push(
        `${column} appears to be a key business metric because it has multiple strong relationships with other variables.`
      );

    }

    if (variation > 1) {

      insights.push(
        `${column} shows significant variability and should be monitored closely as a high-impact KPI.`
      );

    } else if (variation < 0.2) {

      insights.push(
        `${column} remains highly stable, making it suitable for executive dashboard tracking.`
      );

    }

  }

  if (!insights.length) {

    insights.push(
      "No dominant business KPIs could be identified automatically from the current dataset."
    );

  }

  return insights;

}

