export interface DatasetProfileSummary {
  id: string;
  name: string;
  rowCount: number;
  columns: {
    name: string;
    type: string;
    sampleValues?: any[];
  }[];
  metricsSummary?: Record<string, any>;
}

export interface CompositeMAPContext {
  datasetCount: number;
  datasets: DatasetProfileSummary[];
  potentialJoinKeys: {
    leftDatasetId: string;
    rightDatasetId: string;
    leftKey: string;
    rightKey: string;
  }[];
  formattedContextString: string;
}

export class ContextService {
  /**
   * Synthesizes a unified MAP schema context string across 1 or more datasets.
   */
  public static buildCompositeMAPContext(
    profiles: DatasetProfileSummary[]
  ): CompositeMAPContext {
    const potentialJoinKeys: CompositeMAPContext["potentialJoinKeys"] = [];

    // Detect candidate join keys across distinct dataset pairs
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const left = profiles[i];
        const right = profiles[j];

        for (const lCol of left.columns) {
          for (const rCol of right.columns) {
            const lName = lCol.name.toLowerCase().trim();
            const rName = rCol.name.toLowerCase().trim();

            if (
              lName === rName ||
              lName === `${right.name.toLowerCase()}_id` ||
              rName === `${left.name.toLowerCase()}_id` ||
              (lName.endsWith("id") && rName.endsWith("id") && lName === rName)
            ) {
              potentialJoinKeys.push({
                leftDatasetId: left.id,
                rightDatasetId: right.id,
                leftKey: lCol.name,
                rightKey: rCol.name,
              });
            }
          }
        }
      }
    }

    // Build structured Markdown context string for bounded LLM context
    let formatted = `### COMPOSITE MULTI-DATASET CONTEXT (${profiles.length} Active Datasets):\n`;

    profiles.forEach((p, idx) => {
      formatted += `\n[Dataset ${idx + 1}: "${p.name}" (ID: ${p.id})] — ${p.rowCount} Total Rows\n`;
      formatted += `Columns:\n`;
      p.columns.forEach((c) => {
        formatted += `  - ${c.name} (${c.type})\n`;
      });
    });

    if (potentialJoinKeys.length > 0) {
      formatted += `\nCandidate Cross-Dataset Relational Join Keys:\n`;
      potentialJoinKeys.forEach((k) => {
        formatted += `  - [${k.leftKey}] <=> [${k.rightKey}]\n`;
      });
    }

    return {
      datasetCount: profiles.length,
      datasets: profiles,
      potentialJoinKeys,
      formattedContextString: formatted,
    };
  }
}


