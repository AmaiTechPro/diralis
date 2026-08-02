import prisma from "../lib/prisma";

import { parseDataset } from "./datasetFileService";
import { profileDataset } from "./profiler/profileDataset";


export async function getAnalyticsContext() {

  const dataset =
    await prisma.dataset.findFirst({

      orderBy: {
        uploadedAt: "desc",
      },

    });



  if (!dataset) {

    return `
No uploaded dataset found.
`;

  }



  try {

    const rows =
      await parseDataset(dataset.id);



    const profile =
      profileDataset(rows);



    return `

DATASET ANALYTICS INTELLIGENCE


Dataset:

${dataset.originalName}



DATA QUALITY

Quality Score:
${profile.qualityScore}%


Total Rows:
${profile.totalRows}


Columns:
${profile.columns}



DATA ISSUES

Missing Values:
${profile.missingValues}


Duplicate Rows:
${profile.duplicateRows}



COLUMN ANALYSIS

Numeric Columns:
${
  profile.numericColumns.join(", ")
  || "None"
}


Categorical Columns:
${
  profile.categoricalColumns.join(", ")
  || "None"
}



VISUALIZATION INSIGHTS

Recommended Charts:
${
  profile.recommendedCharts.join(", ")
  || "None"
}



ADVANCED ANALYTICS

Correlations Found:
${profile.correlations.length}


Statistics Generated:
${profile.statistics.length}



Instructions:

Use these analytics results to:
- explain business performance
- identify trends
- highlight data quality problems
- generate recommendations
- support decision making

`;



  } catch(error) {

    console.error(error);


    return `
Dataset analytics could not be generated.
`;

  }

}

