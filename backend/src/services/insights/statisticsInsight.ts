export function generateStatisticsInsight(
  statistics: Record<string, unknown>
): string[] {

  const insights: string[] = [];

  for (const [column, value] of Object.entries(statistics)) {

    if (
      typeof value !== "object" ||
      value === null
    ) continue;

    const stats = value as Record<string, number>;

    if (
      stats.min !== undefined &&
      stats.max !== undefined
    ) {

      insights.push(
        `${column} ranges from ${stats.min} to ${stats.max}.`
      );

    }

    if (stats.mean !== undefined) {

      insights.push(
        `Average ${column} is ${stats.mean.toFixed(2)}.`
      );

    }

  }

  return insights;

}

