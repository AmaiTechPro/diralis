import { ColumnProfile } from "../../types/profile";

function detectType(
  value: unknown
): "number" | "string" | "boolean" | "date" {

  if (typeof value === "number") {
    return "number";
  }

  if (typeof value === "boolean") {
    return "boolean";
  }

  if (typeof value === "string") {

    const trimmed = value.trim();

    if (trimmed === "") {
      return "string";
    }

    // Detect numeric strings
    if (!Number.isNaN(Number(trimmed))) {
      return "number";
    }

    // Detect dates
    if (!Number.isNaN(Date.parse(trimmed))) {
      return "date";
    }

    return "string";
  }

  return "string";
}

export function detectColumns(
  rows: Record<string, unknown>[]
): ColumnProfile[] {

  if (!rows.length) {
    return [];
  }

  const columns = Object.keys(rows[0]);

  return columns.map((column) => {

    const sampleValues = rows
      .slice(0, 100)
      .map(row => row[column])
      .filter(
        value =>
          value !== null &&
          value !== undefined &&
          value !== ""
      );

    const detectedTypes =
      sampleValues.map(detectType);

    const typeFrequency =
      detectedTypes.reduce(
        (acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    const dominantType =
      (
        Object.entries(typeFrequency)
          .sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "string"
      ) as ColumnProfile["type"];

    return {
      name: column,
      type: dominantType,
      missing:
        rows.length - sampleValues.length,
      unique:
        new Set(sampleValues.map(String)).size,
    };

  });

}
