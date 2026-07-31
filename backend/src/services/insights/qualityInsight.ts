           {/* Original Generate Insights Code 

export function generateQualityInsight(
  missingValues: Record<string, number>,
  duplicates: number
): string[] {

  const insights: string[] = [];

  Object.entries(missingValues).forEach(
    ([column, missing]) => {

      if (missing > 0) {

        insights.push(
          `${column} contains ${missing} missing values.`
        );

      }

    }
  );

  if (duplicates > 0) {

    insights.push(
      `${duplicates} duplicate rows were detected.`
    );

  }

  if (insights.length === 0) {

    insights.push(
      "No significant data quality issues were detected."
    );

  }

  return insights;

}



          {/* End of Original Generate Insights Code */}


export function generateQualityInsights(
  issues: string[],
  missingValues: Record<string, number>,
  duplicates?: number
): string[] {
  const insights: string[] = [];

  // Report any quality issues directly
  for (const issue of issues) {
    insights.push(`Quality issue detected: ${issue}`);
  }

  // Highlight columns with missing values
  for (const [column, count] of Object.entries(missingValues)) {
    if (count > 0) {
      insights.push(`${column} contains ${count} missing values.`);
    }
  }

  // Handle duplicate rows if provided
  if (duplicates && duplicates > 0) {
    insights.push(`${duplicates} duplicate rows were detected.`);
  }

  // If no issues, missing values, or duplicates
  if (insights.length === 0) {
    insights.push("No significant data quality issues were detected.");
  }

  return insights;
}

