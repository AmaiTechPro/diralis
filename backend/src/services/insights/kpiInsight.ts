import { CorrelationResult, NumericStatistics } from "../../types/profile";

const BLOCKED_TOKENS = ["id", "index", "uuid", "key", "row"];

function isBlocked(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return BLOCKED_TOKENS.some((token) => lower === token || lower.includes(token));
}

export function generateKpiInsights(
  statistics: Record<string, NumericStatistics>,
  correlations: CorrelationResult[]
): string[] {
  const insights: string[] = [];
  const keyMetrics: string[] = [];

  for (const [column, stats] of Object.entries(statistics)) {
    if (isBlocked(column)) continue;

    const variation =
      stats.mean === 0 ? 0 : stats.standardDeviation / stats.mean;

    const relationships = correlations.filter(
      (correlation) =>
        (correlation.columnA === column || correlation.columnB === column) &&
        !isBlocked(correlation.columnA) &&
        !isBlocked(correlation.columnB)
    );

    const strongRelationships = relationships.filter(
      (correlation) => Math.abs(correlation.coefficient) >= 0.7
    );

    if (strongRelationships.length >= 2) {
      keyMetrics.push(column);
    }

    if (variation > 1) {
      insights.push(
        `${column} displays high variance (CV > 1.0), marking it as a volatile operational metric.`
      );
    } else if (variation > 0 && variation < 0.2) {
      insights.push(
        `${column} maintains strong consistency (CV < 0.2), making it an ideal benchmark metric.`
      );
    }
  }

  if (keyMetrics.length > 0) {
    insights.unshift(
      `Key operational drivers identified: ${keyMetrics.slice(0, 4).join(", ")} show high multi-variable interdependence.`
    );
  }

  if (!insights.length) {
    insights.push(
      "No dominant business KPIs could be identified automatically from the current dataset."
    );
  }

  return insights;
}

