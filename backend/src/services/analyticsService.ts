import prisma from "../lib/prisma";

import { parseDataset } from "./datasetFileService";
import { profileDataset } from "./profiler/profileDataset";
import { generateVisualizations } from "./visualizationService";
import { generateInsights } from "./insights/generateInsights";


export async function generateDatasetProfile(
  datasetId: string
) {
  const dataset =
    await prisma.dataset.findUnique({
      where: {
        id: datasetId,
      },
    });

  if (!dataset) {
    throw new Error(
      "Dataset not found."
    );
  }

  const rows =
    await parseDataset(datasetId);

  const profile =
    profileDataset(rows);
    const insights =
  generateInsights(profile);

  const visualizations =
    generateVisualizations(
      rows,
      profile.numericColumns,
      profile.categoricalColumns,
      profile.dateColumns
    );

  return {
    dataset: {
      id: dataset.id,
      name: dataset.originalName,
      filename: dataset.filename,
      size: dataset.size,
      uploadedAt: dataset.uploadedAt,
    },

    profile,

    visualizations,
    insights,
  };
}

