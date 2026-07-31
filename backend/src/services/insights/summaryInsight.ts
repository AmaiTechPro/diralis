export function generateSummaryInsight(
  rows: number,
  columns: number,
  score: number
): string {

  let quality = "Poor";

  if (score >= 90) {
    quality = "Excellent";
  } else if (score >= 75) {
    quality = "Good";
  } else if (score >= 50) {
    quality = "Fair";
  }

  return `This dataset contains ${rows.toLocaleString()} records across ${columns} columns with an overall data quality score of ${score}/100 (${quality}).`;

}

