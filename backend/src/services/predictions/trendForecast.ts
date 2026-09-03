import { detectTrend } from "./trendDirection";
import { linearRegressionPredict } from "./linearRegression";

const BLOCKED_TOKENS = [
  "index",
  "id",
  "customer id",
  "userid",
  "order id",
  "invoice id",
  "invoice",
  "row",
  "uuid",
  "key",
];

function isBlocked(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return BLOCKED_TOKENS.some((token) => lower === token || lower.includes(token));
}

function pickBusinessMetric(numericColumns: string[]): string | undefined {
  return numericColumns.find((column) => !isBlocked(column));
}

function pickDateMetric(dateColumns: string[]): string | undefined {
  return dateColumns.find((column) => !isBlocked(column));
}

export function generateTrendForecast(
  rows: number,
  numericColumns: string[],
  dateColumns: string[],
  statistics: Record<string, unknown>
): string[] {
  const forecasts: string[] = [];

  const metric = pickBusinessMetric(numericColumns);
  const dateField = pickDateMetric(dateColumns);

  if (dateField && metric) {
    forecasts.push(
      `Time-series forecasting models can evaluate chronological trends in ${dateField} to project ${metric}.`
    );
  } else if (metric) {
    forecasts.push(
      `Predictive models can be trained on sequential entries to estimate future values for ${metric}.`
    );
  } else {
    forecasts.push(
      "No non-identifier business metric was identified for predictive forecasting."
    );
  }

  if (rows >= 500) {
    forecasts.push(
      "Dataset sample size provides solid statistical confidence for regression modeling."
    );
  } else {
    forecasts.push(
      "Sample size is limited; expand observation counts to improve regression accuracy."
    );
  }

  if (metric && statistics[metric]) {
    const value = statistics[metric];
    if (typeof value === "object" && value !== null) {
      const stats = value as Record<string, unknown>;
      const samples = stats.samples as number[] | undefined;

      if (samples && samples.length >= 3) {
        const trend = detectTrend(samples);
        const prediction = linearRegressionPredict(samples, 3);
        forecasts.push(
          `${metric} exhibits a ${trend.toLowerCase()} trend. Projected next 3 intervals: ${prediction.join(", ")}.`
        );
      }
    }
  }

  return forecasts;
}

