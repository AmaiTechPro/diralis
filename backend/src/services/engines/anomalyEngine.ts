import { AnomalyRecord } from "./types";

export class AnomalyEngine {
  /**
   * Evaluates numerical distributions using IQR (Interquartile Range)
   * and Modified Z-Scores to surface high/critical deviations.
   */
  public static detectOutliers(
    metricId: string,
    metricName: string,
    dataPoints: { id: string; label: string; value: number }[]
  ): AnomalyRecord[] {
    if (!dataPoints || dataPoints.length < 4) return [];

    const values = dataPoints.map((p) => p.value).sort((a, b) => a - b);
    const n = values.length;

    // 1. Calculate Median & IQR
    const median = n % 2 === 0 ? (values[n / 2 - 1] + values[n / 2]) / 2 : values[Math.floor(n / 2)];
    const q1 = values[Math.floor(n * 0.25)];
    const q3 = values[Math.floor(n * 0.75)];
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // 2. Calculate Mean & Std Dev
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const anomalies: AnomalyRecord[] = [];

    dataPoints.forEach((point) => {
      const isIQROutlier = point.value < lowerBound || point.value > upperBound;
      const zScore = stdDev > 0 ? Math.abs((point.value - mean) / stdDev) : 0;

      if (isIQROutlier || zScore >= 2.5) {
        const delta = median !== 0 ? ((point.value - median) / Math.abs(median)) * 100 : 0;
        
        let severity: AnomalyRecord["severity"] = "LOW";
        if (zScore >= 3.5 || Math.abs(delta) > 100) severity = "CRITICAL";
        else if (zScore >= 3.0 || Math.abs(delta) > 50) severity = "HIGH";
        else if (zScore >= 2.5 || Math.abs(delta) > 25) severity = "MEDIUM";

        anomalies.push({
          id: `anomaly_${point.id}_${Date.now()}`,
          metricId,
          metricName,
          dimensionValue: point.label,
          observedValue: point.value,
          expectedValue: Math.round(median * 100) / 100,
          deltaPercentage: Math.round(delta * 10) / 10,
          severity,
          detectionMethod: isIQROutlier ? "IQR_OUTLIER" : "MODIFIED_Z_SCORE",
          confidence: Math.min(1.0, 0.7 + (zScore / 10)),
          evidence: `Value of ${point.value} deviates by ${delta.toFixed(1)}% from median baseline (${median.toFixed(1)}). Z-score: ${zScore.toFixed(2)}.`,
        });
      }
    });

    return anomalies;
  }
}


