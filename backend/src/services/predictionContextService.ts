import prisma from "../lib/prisma";

import { parseDataset } from "./datasetFileService";
import { generateForecast } from "./forecasting/forecastEngine";


export async function getPredictionContext() {

  const dataset =
    await prisma.dataset.findFirst({

      orderBy: {
        uploadedAt: "desc",
      },

    });



  if (!dataset) {

    return `
No prediction data available.
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
No numeric column found for forecasting.
`;

    }



    const numericValues =
      rows

        .map(
          (row) =>
            row[numericColumn]
        )

        .filter(
          (value): value is number =>
            typeof value === "number"
        );



    const forecast =
      generateForecast({

        numericValues,

        rows,

      });



    return `

FORECASTING INTELLIGENCE


Dataset:

${dataset.originalName}



Forecasted Metric:

${numericColumn}



Forecast Result:

${JSON.stringify(
  forecast,
  null,
  2
)}



Instructions:

Use this forecast to:

- explain expected future trends
- identify growth or decline patterns
- highlight possible business risks
- suggest strategic actions

Do not only describe the numbers.
Explain what they mean for decision making.

`;



  } catch(error) {

    console.error(error);


    return `
Forecasting could not be generated.
`;

  }

}

