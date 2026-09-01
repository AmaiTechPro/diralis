import prisma from "../../lib/prisma";
import { AnomalyEngine } from "../engines/anomalyEngine";

export class ProactiveAnalysisService {
  /**
   * Scans dataset rows deterministically, detects high-severity anomalies,
   * and persists them as proactive Copilot insights.
   */
  public static async analyzeDataset(
    userId: string,
    datasetId: string,
    rows: Record<string, any>[]
  ): Promise<number> {
    if (!rows || rows.length < 4) return 0;

    const firstRow = rows[0];
    const numericKeys = Object.keys(firstRow).filter((k) => typeof firstRow[k] === "number");
    if (numericKeys.length === 0) return 0;

    const targetColumn = numericKeys[0];
    const dataPoints = rows.map((r, i) => ({
      id: String(i),
      label: `Row ${i + 1}`,
      value: Number(r[targetColumn]),
    }));

    const anomalies = AnomalyEngine.detectOutliers(targetColumn, targetColumn, dataPoints);
    if (anomalies.length === 0) return 0;

    // Filter top 3 highest severity anomalies
    const topAnomalies = anomalies
      .filter((a) => a.severity === "HIGH" || a.severity === "CRITICAL")
      .slice(0, 3);

    let createdCount = 0;

    for (const anomaly of topAnomalies) {
      await prisma.copilotInsight.create({
        data: {
          userId,
          datasetId,
          type: "ANOMALY",
          severity: anomaly.severity,
          title: `Unusual Spike in ${anomaly.metricName} (${anomaly.dimensionValue})`,
          metricName: anomaly.metricName,
          observedValue: anomaly.observedValue,
          expectedValue: anomaly.expectedValue,
          deltaPercentage: anomaly.deltaPercentage,
          narrative: `Observed value of ${anomaly.observedValue} represents a ${anomaly.deltaPercentage}% deviation from the baseline.`,
          evidenceJson: [anomaly.evidence],
          mapVersion: 1,
        },
      });
      createdCount++;
    }

    return createdCount;
  }
}


