import prisma from "../lib/prisma";

import { parseDataset } from "./datasetFileService";
import { profileDataset } from "./profiler/profileDataset";

export async function getAnalyticsContext() {
  const dataset = await prisma.dataset.findFirst({
    orderBy: {
      uploadedAt: "desc",
    },
  });

  if (!dataset) {
    return "No uploaded dataset found.";
  }

  try {
    const rows = await parseDataset(dataset.id);

    const profile = profileDataset(rows);

    return `
Dataset Analytics

Dataset:
${dataset.originalName}

Quality Score:
${profile.qualityScore}%

Rows:
${profile.totalRows}

Columns:
${profile.columns}

Missing Values:
${profile.missingValues}

Duplicate Rows:
${profile.duplicateRows}

Numeric Columns:
${profile.numericColumns.join(", ") || "None"}

Categorical Columns:
${profile.categoricalColumns.join(", ") || "None"}

Recommended Charts:
${profile.recommendedCharts.join(", ") || "None"}

Correlations Found:
${profile.correlations.length}

Statistics Generated:
${profile.statistics.length}
`;
  } catch (error) {
    console.error(error);

    return "Dataset analytics could not be generated.";
  }
}

