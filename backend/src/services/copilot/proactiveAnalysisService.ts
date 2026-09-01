import prisma from "../../lib/prisma";
import { AnomalyEngine } from "../engines/anomalyEngine";
import { ProactiveAnalysisResult } from "./responseSemantics";

export class ProactiveAnalysisService {
  /**
   * Scans dataset rows deterministically and returns structured diagnostic status.
   */
  public static async analyzeDataset(
    userId: string,
    datasetId: string,
    rows: Record<string, any>[]
  ): Promise<ProactiveAnalysisResult> {
    const startTime = Date.now();

    if (!rows || rows.length < 4) {
      return {
        status: "INSUFFICIENT_DATA",
        insightsCreated: 0,
        message: "Dataset has fewer than 4 rows; insufficient statistical baseline.",
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const firstRow = rows[0];
      const numericKeys = Object.keys(firstRow).filter(
        (k) => typeof firstRow[k] === "number"
      );

      if (numericKeys.length === 0) {
        return {
          status: "INSUFFICIENT_DATA",
          insightsCreated: 0,
          message: "No numeric columns detected for statistical distribution analysis.",
          durationMs: Date.now() - startTime,
        };
      }

      const targetColumn = numericKeys[0];
      const dataPoints = rows.map((r, i) => ({
        id: String(i),
        label: `Row ${i + 1}`,
        value: Number(r[targetColumn]),
      }));

      const anomalies = AnomalyEngine.detectOutliers(
        targetColumn,
        targetColumn,
        dataPoints
      );

      if (anomalies.length === 0) {
        return {
          status: "NO_ANOMALIES_DETECTED",
          insightsCreated: 0,
          message: "Statistical baseline verified; no high-severity anomalies detected.",
          durationMs: Date.now() - startTime,
        };
      }

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

      return {
        status: "COMPLETED",
        insightsCreated: createdCount,
        message: `Successfully analyzed dataset and generated ${createdCount} proactive insight cards.`,
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        status: "ANALYSIS_FAILED",
        insightsCreated: 0,
        message: `Analysis execution failed: ${error.message || "Internal engine error."}`,
        durationMs: Date.now() - startTime,
      };
    }
  }
}

