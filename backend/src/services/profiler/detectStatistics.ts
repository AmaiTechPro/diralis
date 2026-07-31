import { NumericStatistics } from "../../types/profile";

const BLOCKED_COLUMNS = [
  "id",
  "customer id",
  "phone",
  "phone 1",
  "phone 2",
  "mobile",
  "telephone",
  "email",
  "website",
  "url",
  "postal",
  "postcode",
  "zip",
  "fax",
  "ssn",
  "account",
  "reference",
];

function isBlockedColumn(column: string): boolean {
  const name = column.toLowerCase();

  return BLOCKED_COLUMNS.some(blocked =>
    name.includes(blocked)
  );
}

function calculateMean(values: number[]): number {
  return values.reduce(
    (sum, value) => sum + value,
    0
  ) / values.length;
}

function calculateMedian(values: number[]): number {

  const sorted =
    [...values].sort((a, b) => a - b);

  const middle =
    Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (
      sorted[middle - 1] +
      sorted[middle]
    ) / 2;
  }

  return sorted[middle];

}

function calculateStandardDeviation(
  values: number[],
  mean: number
): number {

  const variance =
    values.reduce(
      (sum, value) =>
        sum + Math.pow(value - mean, 2),
      0
    ) / values.length;

  return Math.sqrt(variance);

}

export function detectStatistics(
  rows: Record<string, unknown>[]
): Record<string, NumericStatistics> {

  if (!rows.length) {
    return {};
  }

  const statistics:
    Record<string, NumericStatistics> = {};

  const columns =
    Object.keys(rows[0]).filter(
      column => !isBlockedColumn(column)
    );

  columns.forEach(column => {

    const numbers =
      rows
        .map(row => {

          const value = row[column];

          if (typeof value === "number") {
            return value;
          }

          if (typeof value === "string") {

            const trimmed = value.trim();

            if (
              trimmed !== "" &&
              !Number.isNaN(Number(trimmed))
            ) {
              return Number(trimmed);
            }

          }

          return null;

        })
        .filter(
          (value): value is number =>
            value !== null
        );

    if (!numbers.length) {
      return;
    }

    const mean =
      calculateMean(numbers);

    statistics[column] = {

      min: Math.min(...numbers),

      max: Math.max(...numbers),

      mean,

      median:
        calculateMedian(numbers),

      standardDeviation:
        calculateStandardDeviation(
          numbers,
          mean
        )

    };

  });

  return statistics;

}

