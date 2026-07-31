import { CorrelationResult } from "../../types/profile";

export function generateCorrelationInsights(
  correlations: CorrelationResult[]
): string[] {

  const insights: string[] = [];

  correlations.forEach(correlation => {

    const strength = Math.abs(correlation.coefficient);

    let description = "";

    if (strength >= 0.9) {
      description = "a very strong";
    } else if (strength >= 0.7) {
      description = "a strong";
    } else if (strength >= 0.5) {
      description = "a moderate";
    } else if (strength >= 0.3) {
      description = "a weak";
    } else {
      return;
    }

    const direction =
      correlation.coefficient > 0
        ? "positive"
        : "negative";

    insights.push(
      `${correlation.columnA} and ${correlation.columnB} show ${description} ${direction} relationship (${correlation.coefficient.toFixed(2)}).`
    );

  });

  if (!insights.length) {

    insights.push(
      "No statistically meaningful relationships were detected between the numeric variables."
    );

  }

  return insights;

}

