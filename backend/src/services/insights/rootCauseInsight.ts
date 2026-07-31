import { CorrelationResult } from "../../types/profile";

export function generateRootCauseInsights(
  correlations: CorrelationResult[]
): string[] {

  const insights: string[] = [];

  correlations.forEach(correlation => {

    if (Math.abs(correlation.coefficient) < 0.8) {
      return;
    }

    if (correlation.coefficient > 0) {
      insights.push(
        `${correlation.columnA} is likely influenced by changes in ${correlation.columnB}.`
      );
    } else {
      insights.push(
        `${correlation.columnA} tends to move opposite to ${correlation.columnB}.`
      );
    }

  });

  if (!insights.length) {
    insights.push(
      "No strong root-cause relationships were detected."
    );
  }

  return insights;

}

