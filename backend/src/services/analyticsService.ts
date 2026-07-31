import prisma from "../lib/prisma";

import { parseDataset } from "./datasetFileService";
import { profileDataset } from "./profiler/profileDataset";
import { generateVisualizations } from "./visualizationService";

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
  };
}

