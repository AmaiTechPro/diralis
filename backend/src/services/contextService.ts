import prisma from "../lib/prisma";
import { parseDataset } from "./datasetFileService";
import { profileDataset } from "./profiler/profileDataset";

export async function buildDatasetContext(userId: string, datasetId?: string): Promise<string> {
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

  try {
    let profile: any = dataset.profileJson;

    // Fallback: If profileJson wasn't computed during upload, try parsing once and save to DB
    if (!profile) {
      try {
        const rows = await parseDataset(dataset.id);
        profile = profileDataset(rows);
        await prisma.dataset.update({
          where: { id: dataset.id },
          data: { profileJson: profile },
        });
      } catch (fileErr) {
        // Disk file gone on Render restart and no profile cached
        return `
### ACTIVE DATASET MAP (Metadata Aggregation Profile)
- File: ${dataset.originalName}
- Status: The raw source file was cleared during environment redeployment, and no persistent summary is cached. Please re-upload "${dataset.originalName}" to resume deterministic analytics.
`;
      }
    }

    // Retrieve proactive insights
    const insights = await prisma.copilotInsight.findMany({
      where: { datasetId: dataset.id, dismissedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const columnSummary = profile.columnProfiles
      ?.map(
        (col: any) =>
          `- ${col.name} [Type: ${col.type}, Unique: ${col.unique}, Missing: ${col.missing}]`
      )
      .join("\n") || "None";

    const statKeys = Object.keys(profile.statistics || {});
    const numericSummary =
      statKeys.length > 0
        ? statKeys
            .map((col) => {
              const s = profile.statistics[col];
              return `- ${col}: Min=${s.min}, Max=${s.max}, Mean=${s.mean?.toFixed(2)}, Median=${s.median?.toFixed(2)}, StdDev=${s.standardDeviation?.toFixed(2)}`;
            })
            .join("\n")
        : "None detected.";

    const correlationSummary =
      profile.correlations && profile.correlations.length > 0
        ? profile.correlations
            .slice(0, 5)
            .map((c: any) => `- ${c.columnA} <-> ${c.columnB}: r = ${c.coefficient?.toFixed(3)}`)
            .join("\n")
        : "No significant linear correlations detected.";

    const insightSummary =
      insights.length > 0
        ? insights
            .map(
              (ins) =>
                `- [${ins.severity}] ${ins.title}: ${ins.narrative} (Observed: ${ins.observedValue})`
            )
            .join("\n")
        : "No active anomalous thresholds flagged.";

    return `
### ACTIVE DATASET MAP (Metadata Aggregation Profile)
- File: ${dataset.originalName} (ID: ${dataset.id})
- Dimensions: ${profile.totalRows || profile.rows || "N/A"} Rows x ${profile.columns || "N/A"} Columns
- Quality Score: ${profile.qualityScore || 100}% (Duplicates: ${profile.duplicateRows || 0})

#### SCHEMA & DATA TYPES
${columnSummary}

#### NUMERIC DISTRIBUTIONS & AGGREGATES
${numericSummary}

#### DETECTED CORRELATIONS
${correlationSummary}

#### COPILOT PROACTIVE INSIGHTS & ANOMALIES
${insightSummary}

#### GROUNDING DIRECTIVE
Answer strictly from the observed statistical facts, distributions, column boundaries, and metrics provided above. Do not fabricate raw rows, imaginary product codes, or fictitious currency figures.
`;
  } catch (error) {
    console.error("[buildMAPContext Profiling Error]:", error);
    return `
### ACTIVE DATASET MAP (Metadata Aggregation Profile)
- Name: ${dataset.originalName}
- Status: Detailed profiling encountered an issue. Rely strictly on verified schema properties.
`;
  }
}

