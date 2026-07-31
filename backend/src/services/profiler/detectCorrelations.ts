import { CorrelationResult } from "../../types/profile";

const BLOCKED_COLUMNS = [
  "id",
  "customer id",
  "phone",
  "phone 1",
  "phone 2",
  "mobile",
  "telephone",
  "zip",
  "postal",
  "postcode",
  "fax",
  "ssn",
  "account",
  "reference"
];

function isBlockedColumn(column: string): boolean {
  const name = column.toLowerCase();

  return BLOCKED_COLUMNS.some(blocked =>
    name.includes(blocked)
  );
}

function pearsonCorrelation(
  x: number[],
  y: number[]
): number {

  const n = x.length;

  const meanX =
    x.reduce((a, b) => a + b, 0) / n;

  const meanY =
    y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  for (let i = 0; i < n; i++) {

    const dx = x[i] - meanX;
    const dy = y[i] - meanY;

    numerator += dx * dy;
    denominatorX += dx * dx;
    denominatorY += dy * dy;

  }

  const denominator =
    Math.sqrt(denominatorX * denominatorY);

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;

}

export function detectCorrelations(
  rows: Record<string, unknown>[]
): CorrelationResult[] {

  if (!rows.length) {
    return [];
  }

  const numericColumns =
    Object.keys(rows[0]).filter(column => {

      if (isBlockedColumn(column)) {
        return false;
      }

      return rows.every(row => {

        const value = row[column];

        if (typeof value === "number") {
          return true;
        }

        if (typeof value === "string") {
          const trimmed = value.trim();
          return (
            trimmed !== "" &&
            !Number.isNaN(Number(trimmed))
          );
        }

        return false;

      });

    });

  const correlations: CorrelationResult[] = [];

  for (let i = 0; i < numericColumns.length; i++) {

    for (let j = i + 1; j < numericColumns.length; j++) {

      const columnA = numericColumns[i];
      const columnB = numericColumns[j];

      const valuesA =
        rows.map(row => Number(row[columnA]));

      const valuesB =
        rows.map(row => Number(row[columnB]));

      correlations.push({
        columnA,
        columnB,
        coefficient:
          pearsonCorrelation(
            valuesA,
            valuesB
          )
      });

    }

  }

  return correlations;

}

