export function generateQualityInsights(
  issues: string[],
  missingValues: Record<string, number>,
  duplicates?: number
): string[] {
  const insights: string[] = [];

  // Report high-level quality flags directly
  for (const issue of issues) {
    insights.push(`Data quality alert: ${issue}.`);
  }

  // Aggregate missing values dynamically
  const columnsWithMissing = Object.entries(missingValues)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]); // Sort descending by missing count

  if (columnsWithMissing.length > 0) {
    const totalMissing = columnsWithMissing.reduce((sum, [_, count]) => sum + count, 0);

    if (columnsWithMissing.length <= 3) {
      for (const [column, count] of columnsWithMissing) {
        insights.push(`${column} contains ${count.toLocaleString()} missing values.`);
      }
    } else {
      const topColumns = columnsWithMissing
        .slice(0, 3)
        .map(([col, count]) => `${col} (${count})`)
        .join(", ");

      insights.push(
        `Missing values detected across ${columnsWithMissing.length} columns (${totalMissing.toLocaleString()} total cells). Highest impact in: ${topColumns}.`
      );
    }
  }

  // Handle duplicate records
  if (duplicates && duplicates > 0) {
    insights.push(`${duplicates.toLocaleString()} duplicate record(s) detected across sample rows.`);
  }

  if (insights.length === 0) {
    insights.push("No significant data hygiene or null-value anomalies detected.");
  }

  return insights;
}


