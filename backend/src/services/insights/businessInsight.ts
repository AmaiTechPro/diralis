export function generateBusinessInsights(
  profile: {
    rows: number;
    numericColumns: string[];
    categoricalColumns: string[];
    dateColumns: string[];
    duplicateRows: number;
  }
): string[] {

  const insights: string[] = [];

  const businessMetrics =
    profile.numericColumns.filter(
      column =>
        column.toLowerCase() !== "index"
    );

  if (profile.rows > 1000) {

    insights.push(
      "This dataset is sufficiently large for reliable trend analysis."
    );

  } else {

    insights.push(
      "This dataset is relatively small. Interpret trends with caution."
    );

  }

  if (businessMetrics.length >= 3) {

    insights.push(
      "Multiple numeric variables are available for KPI and forecasting analysis."
    );

  } else if (businessMetrics.length > 0) {

    insights.push(
      "Business metrics are available for KPI analysis."
    );

  }

  if (profile.categoricalColumns.length >= 2) {

    insights.push(
      "Customer or operational segmentation analysis is possible."
    );

  }

  if (
    profile.dateColumns.length > 0 &&
    businessMetrics.length > 0
  ) {

    insights.push(
      "Time-series forecasting can be performed using the available date fields."
    );

  }

  if (profile.duplicateRows === 0) {

    insights.push(
      "No duplicate records were found, increasing confidence in analytical results."
    );

  }

  return insights;

}

