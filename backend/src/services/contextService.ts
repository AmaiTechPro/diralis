import prisma from "../lib/prisma";


export async function buildDatasetContext() {

  const datasets =
    await prisma.dataset.findMany({

      orderBy: {
        uploadedAt: "desc",
      },

      take: 5,

    });



  if (datasets.length === 0) {

    return `
No datasets have been uploaded yet.

The user has not provided business data.
`;

  }



  return `

DATASET OVERVIEW

Total recent datasets:
${datasets.length}


${datasets
  .map(
    (dataset, index) => `

Dataset ${index + 1}

Name:
${dataset.originalName}

File Type:
${dataset.mimetype}

Size:
${(dataset.size / 1024).toFixed(2)} KB

Uploaded:
${dataset.uploadedAt.toLocaleString()}

`
  )
  .join("\n")}


Use this information to understand
the available business data sources.

`;

}

