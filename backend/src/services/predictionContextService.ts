import prisma from "../lib/prisma";

import { parseDataset } from "./datasetFileService";
import { generateForecast } from "./forecasting/forecastEngine";

export async function getPredictionContext() {
  const dataset = await prisma.dataset.findFirst({
    orderBy: {
      uploadedAt: "desc",
    },
  });

  if (!dataset) {
    return "No prediction data available.";
  }

  try {
    const rows = await parseDataset(dataset.id);

    if (rows.length === 0) {
      return "Dataset is empty.";
    }

    // Find the first numeric column
    const firstRow = rows[0];

    const numericColumn = Object.keys(firstRow).find((key) =>
      rows.every(
        (row) =>
          typeof row[key] === "number" &&
          !Number.isNaN(row[key] as number)
      )
    );

    if (!numericColumn) {
      return "No numeric column found for forecasting.";
    }

    const numericValues = rows
      .map((row) => row[numericColumn])
      .filter(
        (value): value is number =>
          typeof value === "number"
      );

    const forecast = generateForecast({
      numericValues,
      rows,
    });

    return `
Forecast Analysis

Analyzed Column:
${numericColumn}

${JSON.stringify(forecast, null, 2)}
`;
  } catch (error) {
    console.error(error);

    return "Forecasting could not be generated.";
  }
}

