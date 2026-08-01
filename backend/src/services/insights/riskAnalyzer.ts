export function analyzeRisks(
  quality: number,
  warnings: number
): string[] {

  const risks: string[] = [];

  if (quality < 80) {
    risks.push(
      "Poor data quality may reduce prediction accuracy."
    );
  }

  if (warnings > 0) {
    risks.push(
      `${warnings} warning(s) require attention before advanced analytics.`
    );
  }

  if (risks.length === 0) {
    risks.push(
      "No major analytical risks detected."
    );
  }

  return risks;
}

