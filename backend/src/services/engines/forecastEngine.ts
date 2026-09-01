import { ForecastResult, ForecastPoint } from "./types";

export class ForecastEngine {
  /**
   * Generates deterministic linear trend projections with standard 80% & 95% confidence intervals.
   */
  public static generateLinearTrend(
    metricId: string,
    metricName: string,
    history: { period: string; value: number }[],
    horizonPeriods: number = 3
  ): ForecastResult {
    if (!history || history.length < 3) {
      return {
        metricId,
        metricName,
        algorithm: "LINEAR_REGRESSION",
        historicalPeriodsCount: history?.length || 0,
        forecastHorizonCount: 0,
        points: [],
        goodnessOfFit: { rSquared: 0, mape: 0 },
        limitationsNotice: "Insufficient historical data points for projection (minimum 3 required).",
        isDeterministic: true,
      };
    }

    const n = history.length;
    const x = history.map((_, index) => index + 1);
    const y = history.map((p) => p.value);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;

    let numerator = 0;
    let denomX = 0;
    let ssTotal = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denomX += Math.pow(x[i] - meanX, 2);
      ssTotal += Math.pow(y[i] - meanY, 2);
    }

    const slope = denomX !== 0 ? numerator / denomX : 0;
    const intercept = meanY - slope * meanX;

    // Calculate R-Squared and Residual Standard Error
    let ssResidual = 0;
    for (let i = 0; i < n; i++) {
      const yFit = intercept + slope * x[i];
      ssResidual += Math.pow(y[i] - yFit, 2);
    }

    const rSquared = ssTotal !== 0 ? Math.max(0, 1 - ssResidual / ssTotal) : 0;
    const standardError = n > 2 ? Math.sqrt(ssResidual / (n - 2)) : 0;

    // Project points for the future horizon
    const points: ForecastPoint[] = [];
    const z80 = 1.282; // 80% confidence critical value
    const z95 = 1.96;  // 95% confidence critical value

    for (let h = 1; h <= horizonPeriods; h++) {
      const targetIndex = n + h;
      const projected = intercept + slope * targetIndex;

      // Dynamic prediction interval margin
      const leverage = 1 + 1 / n + Math.pow(targetIndex - meanX, 2) / (denomX || 1);
      const margin80 = z80 * standardError * Math.sqrt(leverage);
      const margin95 = z95 * standardError * Math.sqrt(leverage);

      points.push({
        period: `Period +${h}`,
        projectedValue: Math.round(projected * 100) / 100,
        lowerBound80: Math.round((projected - margin80) * 100) / 100,
        upperBound80: Math.round((projected + margin80) * 100) / 100,
        lowerBound95: Math.round((projected - margin95) * 100) / 100,
        upperBound95: Math.round((projected + margin95) * 100) / 100,
      });
    }

    return {
      metricId,
      metricName,
      algorithm: "LINEAR_REGRESSION",
      historicalPeriodsCount: n,
      forecastHorizonCount: horizonPeriods,
      points,
      goodnessOfFit: { rSquared: Math.round(rSquared * 1000) / 1000 },
      limitationsNotice: "Projections assume continuation of linear trends without sudden macroeconomic disruptions.",
      isDeterministic: true,
    };
  }
}




