import prisma from "../lib/prisma";

import { parseDataset } from "./datasetFileService";

import { analyzeTrend } from "./predictions/trendIntelligence";
import { generateBusinessRecommendation } from "./predictions/businessRecommendationEngine";


export async function getRecommendationContext() {

  const dataset =
    await prisma.dataset.findFirst({

      orderBy: {
        uploadedAt: "desc",
      },

    });



  if (!dataset) {

    return `
No recommendation data available.
`;

  }



  try {

    const rows =
      await parseDataset(dataset.id);



    if (rows.length === 0) {

      return `
Dataset is empty.
`;

    }



    const firstRow =
      rows[0];



    const numericColumn =
      Object.keys(firstRow).find(
        (key) =>
          rows.every(
            (row) =>
              typeof row[key] === "number" &&
              !Number.isNaN(
                row[key] as number
              )
          )
      );



    if (!numericColumn) {

      return `
No numeric column found for trend analysis.
`;

    }



    const values =
      rows

        .map(
          (row) =>
            row[numericColumn]
        )

        .filter(
          (value): value is number =>
            typeof value === "number"
        );



    const trend =
      analyzeTrend(values);



    const recommendation =
      generateBusinessRecommendation(
        trend
      );



    return `

BUSINESS RECOMMENDATION INTELLIGENCE


Dataset:

${dataset.originalName}



Analyzed Metric:

${numericColumn}



Trend Analysis:

${JSON.stringify(
  trend,
  null,
  2
)}



Priority:

${recommendation.priority}



Recommendation:

${recommendation.recommendation}



Reason:

${recommendation.reason}



Instructions:

Use this intelligence to:

- provide strategic business advice
- explain why the recommendation matters
- connect recommendations with trends
- suggest practical actions

`;



  } catch(error) {

    console.error(error);


    return `
Business recommendation could not be generated.
`;

  }

}

