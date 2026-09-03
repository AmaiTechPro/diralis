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
  // 1. Fetch targeted or most recently uploaded dataset
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
    // 2. Parse dataset deterministically via stream (server-side only, raw rows never forwarded to LLM)
    const rows = await parseDataset(dataset.id);
    const profile = profileDataset(rows);

    // 3. Retrieve pre-computed Copilot proactive insights
    const insights = await prisma.copilotInsight.findMany({
      where: { datasetId: dataset.id, dismissedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // 4. Format Column Summaries
    const columnSummary = profile.columnProfiles
      .map(
        (col) =>
          `- ${col.name} [Type: ${col.type}, Unique: ${col.unique}, Missing: ${col.missing}]`
      )
      .join("\n");

    // 5. Format Numeric Distributions
    const statKeys = Object.keys(profile.statistics || {});
    const numericSummary =
      statKeys.length > 0
        ? statKeys
            .map((col) => {
              const s = profile.statistics[col];
              return `- ${col}: Min=${s.min}, Max=${s.max}, Mean=${s.mean.toFixed(2)}, Median=${s.median.toFixed(2)}, StdDev=${s.standardDeviation.toFixed(2)}`;
            })
            .join("\n")
        : "None detected.";

    // 6. Format Significant Correlations
    const correlationSummary =
      profile.correlations && profile.correlations.length > 0
        ? profile.correlations
            .slice(0, 5)
            .map((c) => `- ${c.columnA} <-> ${c.columnB}: r = ${c.coefficient.toFixed(3)}`)
            .join("\n")
        : "No significant linear correlations detected.";

    // 7. Format Proactive Anomaly Insights
    const insightSummary =
      insights.length > 0
        ? insights
            .map(
              (ins) =>
                `- [${ins.severity}] ${ins.title}: ${ins.narrative} (Observed: ${ins.observedValue})`
            )
            .join("\n")
        : "No active anomalous thresholds flagged.";

    // 8. Return Compact, Token-Bounded MAP Payload
    return `
### ACTIVE DATASET MAP (Metadata Aggregation Profile)
- File: ${dataset.originalName} (ID: ${dataset.id})
- Dimensions: ${profile.totalRows || profile.rows} Rows x ${profile.columns} Columns
- Quality Score: ${profile.qualityScore}% (Duplicates: ${profile.duplicateRows})

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
- Identifier: ${dataset.id}
- Status: Detailed profiling encountered an issue during extraction. Rely strictly on verified schema properties.
`;
  }
}


