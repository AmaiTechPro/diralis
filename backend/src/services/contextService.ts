import prisma from "../lib/prisma";

export async function buildDatasetContext(userId: string, datasetId?: string): Promise<string> {
  // 1. Tenant-isolated query
  const datasets = await prisma.dataset.findMany({
    where: {
      userId,
      ...(datasetId ? { id: datasetId } : {}),
    },
    orderBy: { uploadedAt: "desc" },
    take: datasetId ? 1 : 3,
  });

  if (datasets.length === 0) {
    return "No dataset context available for this user workspace.";
  }

  const summaries = datasets.map((ds, idx) => {
    return `
Dataset ${idx + 1}: ${ds.originalName}
- MIME: ${ds.mimetype}
- Size: ${(ds.size / 1024).toFixed(2)} KB
- Uploaded: ${ds.uploadedAt.toISOString()}
`;
  });

  return `### AVAILABLE DATASETS IN WORKSPACE:\n${summaries.join("\n")}`;
}

export async function buildMAPContext(userId: string, datasetId?: string): Promise<string> {
  // Find the targeted dataset or most recent active dataset owned by this user
  const dataset = await prisma.dataset.findFirst({
    where: {
      userId,
      ...(datasetId ? { id: datasetId } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  });

  if (!dataset) {
    return "NO_DATASET_UPLOADED";
  }

  // Return compact schema & metadata profile
  return `
### ACTIVE DATASET MAP (Metadata Aggregation Profile)
- Name: ${dataset.originalName}
- Identifier: ${dataset.id}
- Dimensions / Scope: Compact profile active.
- Grounding Rule: Rely strictly on observed columns and aggregated summaries. Do not invent raw cell entries.
`;
}

