import fs from "fs/promises";
import path from "path";
import prisma from "../lib/prisma";


export async function getLatestDatasetContext() {

  const dataset =
    await prisma.dataset.findFirst({

      orderBy: {
        uploadedAt: "desc",
      },

    });



  if (!dataset) {

    return `
No dataset has been uploaded.
`;

  }



  try {

    const filePath =
      path.join(
        process.cwd(),
        "uploads",
        dataset.filename
      );


    const content =
      await fs.readFile(
        filePath,
        "utf-8"
      );



    const preview =
      content.substring(0, 6000);



    return `

LATEST BUSINESS DATASET

Name:
${dataset.originalName}


File Type:
${dataset.mimetype}


Uploaded:
${dataset.uploadedAt.toLocaleString()}


DATA PREVIEW:

${preview}


Instructions:

Analyze this dataset when answering user questions.

Look for:
- trends
- patterns
- anomalies
- business opportunities
- risks

Provide actionable recommendations.

`;

  } catch {

    return `

DATASET INFORMATION

Name:
${dataset.originalName}


The dataset file exists,
but could not be loaded.

`;

  }

}

