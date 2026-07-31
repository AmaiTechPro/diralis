import { detectTrend } from "./trendDirection";
import { linearRegressionPredict } from "./linearRegression";

function pickBusinessMetric(
  numericColumns: string[]
): string | undefined {

  const blocked = [
    "index",
    "id",
    "customer id",
    "userid",
    "order id",
    "invoice id",
    "row"
  ];

  return numericColumns.find(column => {

    const name = column.toLowerCase();

    return !blocked.some(word => name.includes(word));

  });

}

export function generateTrendForecast(
  rows: number,
  numericColumns: string[],
  dateColumns: string[],
  statistics: Record<string, unknown>
): string[] {

  const forecasts: string[] = [];

  const metric =
    pickBusinessMetric(numericColumns);

  if (
    dateColumns.length > 0 &&
    metric
  ) {

    forecasts.push(
      `Forecasting models can be built using ${dateColumns[0]} to predict future ${metric} values.`
    );

  } else {

    forecasts.push(
      "No suitable business metric was detected for predictive forecasting."
    );

  }

  if (rows >= 1000) {

    forecasts.push(
      "Dataset size is adequate for machine learning forecasting models."
    );

  } else {

    forecasts.push(
      "Larger datasets generally improve prediction accuracy."
    );

  }

  for (const [column, value] of Object.entries(statistics)) {

    if (
      typeof value !== "object" ||
      value === null
    ) continue;

    if (
      !metric ||
      column !== metric
    ) continue;

    const stats =
      value as Record<string, unknown>;

    const samples =
      stats.samples as number[] | undefined;

    if (!samples) continue;

    const trend =
      detectTrend(samples);

    const prediction =
      linearRegressionPredict(samples, 3);

    forecasts.push(
      `${column} shows a ${trend.toLowerCase()} trend. Predicted next values: ${prediction.join(", ")}`
    );

  }

  return forecasts;

}

