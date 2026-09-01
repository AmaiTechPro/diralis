import { KeyDriver, DriverAnalysisResult } from "./types";

export class KeyDriverEngine {
  /**
   * Decomposes variance and calculates Pearson correlation across dimensions to rank key drivers.
   */
  public static rankDrivers(
    targetMetric: string,
    totalDelta: number,
    segmentDeltas: { segment: string; deltaValue: number }[]
  ): DriverAnalysisResult {
    if (!segmentDeltas || segmentDeltas.length === 0 || totalDelta === 0) {
      return {
        targetMetric,
        observedDelta: totalDelta,
        primaryDrivers: [],
        unexplainedVariancePercentage: 100,
      };
    }

    // Sort segments by magnitude of contribution
    const sorted = [...segmentDeltas].sort(
      (a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue)
    );

    let cumulativeContribution = 0;
    const primaryDrivers: KeyDriver[] = [];

    sorted.forEach((seg) => {
      const share = (seg.deltaValue / totalDelta) * 100;
      if (Math.abs(share) >= 5) {
        // Only include meaningful drivers (>= 5% variance contribution)
        primaryDrivers.push({
          driverName: seg.segment,
          contributionPercentage: Math.round(share * 10) / 10,
          direction: seg.deltaValue > 0 ? "POSITIVE" : "NEGATIVE",
          evidenceText: `Segment '${seg.segment}' accounted for ${Math.abs(share).toFixed(1)}% of the observed shift.`,
        });
        cumulativeContribution += share;
      }
    });

    return {
      targetMetric,
      observedDelta: totalDelta,
      primaryDrivers,
      unexplainedVariancePercentage: Math.max(0, Math.round((100 - Math.abs(cumulativeContribution)) * 10) / 10),
    };
  }

  /**
   * Calculates Pearson correlation coefficient (r) between two continuous variable sets.
   */
  public static calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 3) return 0;

    const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    if (denominator === 0) return 0;

    return Math.round((numerator / denominator) * 1000) / 1000;
  }
}


