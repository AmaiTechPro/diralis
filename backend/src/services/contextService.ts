import prisma from "../lib/prisma";

export async function buildDatasetContext() {
  const datasets = await prisma.dataset.findMany({
    orderBy: {
      uploadedAt: "desc",
    },
    take: 5,
  });

  if (datasets.length === 0) {
    return "No datasets have been uploaded yet.";
  }

  return `
Datasets uploaded: ${datasets.length}

Recent datasets:

${datasets
  .map(
    (dataset, index) => `
${index + 1}.
Name: ${dataset.originalName}
Type: ${dataset.mimetype}
Size: ${(dataset.size / 1024).toFixed(2)} KB
Uploaded: ${dataset.uploadedAt.toLocaleString()}
`
  )
  .join("\n")}
`;
}

