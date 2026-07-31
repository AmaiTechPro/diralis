export function generateAnomalyInsights(
  statistics: Record<string, unknown>
): string[] {

  const insights: string[] = [];

  for (const [column, value] of Object.entries(statistics)) {

    if (
      typeof value !== "object" ||
      value === null
    ) continue;

    const stats =
      value as Record<string, unknown>;

    const min =
      Number(stats.min);

    const max =
      Number(stats.max);

    const average =
      Number(stats.average);

    if (
      Number.isNaN(min) ||
      Number.isNaN(max) ||
      Number.isNaN(average)
    ) continue;

    const spread = max - min;

    if (
      average > 0 &&
      spread > average * 5
    ) {

      insights.push(
        `${column} contains unusually large variations that may indicate outliers.`
      );

    }

    if (
      average > 0 &&
      max > average * 10
    ) {

      insights.push(
        `${column} has extremely high values compared with its average.`
      );

    }

    if (
      min === max
    ) {

      insights.push(
        `${column} has no variation and may provide little analytical value.`
      );

    }

  }

  return insights;

}

