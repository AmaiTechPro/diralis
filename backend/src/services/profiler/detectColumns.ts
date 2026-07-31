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
    if (!isNaN(Number(trimmed))) {
      return "number";
    }

    // Detect dates
    if (!isNaN(Date.parse(trimmed))) {
      return "date";
    }

    return "string";
  }

  return "string";
}


export function detectColumns(rows: Record<string, unknown>[]) {

  if (!rows || rows.length === 0) {
    return [];
  }

  const columns = Object.keys(rows[0]);

  return columns.map((column) => {

    const sampleValues = rows
      .slice(0, 100)
      .map(row => row[column])
      .filter(value => value !== null && value !== undefined);


    const detectedTypes = sampleValues.map(detectType);

    const typeFrequency = detectedTypes.reduce(
      (acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );


    const dominantType = Object.entries(typeFrequency)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "string";


    return {
      name: column,
      type: dominantType,
      samples: sampleValues.slice(0, 5),
      uniqueValues: new Set(sampleValues.map(String)).size,
      nullCount:
        rows.length - sampleValues.length
    };
  });
}

