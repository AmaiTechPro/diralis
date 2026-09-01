export interface DataPoint {
  period: string;
  value: number;
}

export interface ForecastPoint {
  period: string;
  projectedValue: number;
  lowerBound80?: number;
  upperBound80?: number;
  lowerBound95?: number;
  upperBound95?: number;
  lowerBound?: number; // Backward-compatibility alias for 95%
  upperBound?: number; // Backward-compatibility alias for 95%
}

export interface ForecastResult {
  metricId: string;
  metricName: string;
  modelType: "LINEAR_TREND" | "HOLT_LINEAR" | "HOLT_WINTERS_ADDITIVE";
  detectedPeriodicity?: number;
  historicalPoints: DataPoint[];
  points: ForecastPoint[];
  goodnessOfFit: {
    rSquared?: number;
    mae: number;
    rmse: number;
    mape?: number;
  };
}

export class ForecastEngine {
  /**
   * Generates a linear trend projection with bounded prediction intervals.
   * Preserved for backward-compatibility with Phase 3.0 / 3.1.
   */
  public static generateLinearTrend(
    metricId: string,
    metricName: string,
    history: DataPoint[],
    periodsToForecast: number = 3
  ): ForecastResult {
    const n = history.length;
    if (n < 2) {
      throw new Error("At least 2 historical data points are required for trend forecasting.");
    }

    const x = history.map((_, i) => i + 1);
    const y = history.map((p) => Number(p.value));

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Residuals and Standard Error
    const yMean = sumY / n;
    let ssTot = 0;
    let ssRes = 0;
    let sumAbsErr = 0;

    for (let i = 0; i < n; i++) {
      const yHat = intercept + slope * x[i];
      const res = y[i] - yHat;
      ssTot += Math.pow(y[i] - yMean, 2);
      ssRes += Math.pow(res, 2);
      sumAbsErr += Math.abs(res);
    }

    const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
    const mae = sumAbsErr / n;
    const stdErr = Math.sqrt(ssRes / Math.max(1, n - 2));

    const points: ForecastPoint[] = [];
    for (let k = 1; k <= periodsToForecast; k++) {
      const xForecast = n + k;
      const projectedValue = Number((intercept + slope * xForecast).toFixed(4));
      
      const margin80 = Number((1.282 * stdErr * Math.sqrt(1 + 1 / n + Math.pow(xForecast - sumX / n, 2) / (sumX2 - (sumX * sumX) / n))).toFixed(4));
      const margin95 = Number((1.960 * stdErr * Math.sqrt(1 + 1 / n + Math.pow(xForecast - sumX / n, 2) / (sumX2 - (sumX * sumX) / n))).toFixed(4));

      points.push({
        period: `Projected +${k}`,
        projectedValue,
        lowerBound80: Number((projectedValue - margin80).toFixed(4)),
        upperBound80: Number((projectedValue + margin80).toFixed(4)),
        lowerBound95: Number((projectedValue - margin95).toFixed(4)),
        upperBound95: Number((projectedValue + margin95).toFixed(4)),
        lowerBound: Number((projectedValue - margin95).toFixed(4)),
        upperBound: Number((projectedValue + margin95).toFixed(4)),
      });
    }

    return {
      metricId,
      metricName,
      modelType: "LINEAR_TREND",
      historicalPoints: history,
      points,
      goodnessOfFit: {
        rSquared: Number(rSquared.toFixed(4)),
        mae: Number(mae.toFixed(4)),
        rmse: Number(stdErr.toFixed(4)),
      },
    };
  }

  /**
   * Auto-detects seasonal period L from history length and labels.
   * Matches L = 4 (Quarterly), L = 7 (Weekly), or L = 12 (Monthly).
   */
  public static detectSeasonalityPeriod(history: DataPoint[]): number | null {
    const n = history.length;
    if (n < 8) return null;

    const labels = history.map((h) => h.period.toLowerCase());
    
    // Pattern check in labels
    const hasQuarters = labels.some((l) => /q[1-4]|quarter/i.test(l));
    if (hasQuarters && n >= 8) return 4;

    const hasMonths = labels.some((l) => /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(l));
    if (hasMonths && n >= 24) return 12;

    const hasDays = labels.some((l) => /mon|tue|wed|thu|fri|sat|sun/i.test(l));
    if (hasDays && n >= 14) return 7;

    // Autocorrelation heuristic for L in [4, 7, 12]
    const candidates = [4, 7, 12].filter((l) => n >= 2 * l);
    if (!candidates.length) return null;

    let bestL: number | null = null;
    let maxCorr = 0.35; // Threshold for significant seasonal peak

    const values = history.map((h) => h.value);
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);

    if (variance === 0) return null;

    for (const L of candidates) {
      let autocov = 0;
      for (let t = 0; t < n - L; t++) {
        autocov += (values[t] - mean) * (values[t + L] - mean);
      }
      const r = autocov / variance;
      if (r > maxCorr) {
        maxCorr = r;
        bestL = L;
      }
    }

    return bestL;
  }

  /**
   * Holt-Winters Triple Exponential Smoothing (Additive Seasonality)
   * Falls back to Holt's Linear (Double) if history is insufficient for seasonality.
   */
  public static generateSeasonalForecast(
    metricId: string,
    metricName: string,
    history: DataPoint[],
    periodsToForecast: number = 4,
    forcedL?: number
  ): ForecastResult {
    const n = history.length;
    if (n < 4) {
      return this.generateLinearTrend(metricId, metricName, history, periodsToForecast);
    }

    const L = forcedL || this.detectSeasonalityPeriod(history);

    // If seasonal periods < 2 full cycles, use Holt's Linear (No seasonality)
    if (!L || n < 2 * L) {
      return this.generateHoltLinear(metricId, metricName, history, periodsToForecast);
    }

    const y = history.map((p) => p.value);
    const alpha = 0.2;
    const beta = 0.1;
    const gamma = 0.3;

    // Initial Seasonals (averaged over first 2 cycles)
    const seasonals = new Array(L).fill(0);
    const cycle1Mean = y.slice(0, L).reduce((a, b) => a + b, 0) / L;
    const cycle2Mean = y.slice(L, 2 * L).reduce((a, b) => a + b, 0) / L;

    for (let i = 0; i < L; i++) {
      seasonals[i] = ((y[i] - cycle1Mean) + (y[i + L] - cycle2Mean)) / 2;
    }

    // Initial Level and Trend
    let level = cycle2Mean;
    let trend = (cycle2Mean - cycle1Mean) / L;

    const fitted: number[] = [];
    let sumAbsErr = 0;
    let sumSqErr = 0;

    for (let t = 0; t < n; t++) {
      const sIndex = t % L;
      const prevLevel = level;
      const prevTrend = trend;
      const currentSeasonal = seasonals[sIndex];

      const yHat = prevLevel + prevTrend + currentSeasonal;
      fitted.push(yHat);

      const err = y[t] - yHat;
      sumAbsErr += Math.abs(err);
      sumSqErr += err * err;

      // Update equations
      level = alpha * (y[t] - currentSeasonal) + (1 - alpha) * (prevLevel + prevTrend);
      trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
      seasonals[sIndex] = gamma * (y[t] - level) + (1 - gamma) * currentSeasonal;
    }

    const mae = sumAbsErr / n;
    const rmse = Math.sqrt(sumSqErr / n);

    const points: ForecastPoint[] = [];
    for (let h = 1; h <= periodsToForecast; h++) {
      const sIndex = (n + h - 1) % L;
      const forecastVal = Number((level + h * trend + seasonals[sIndex]).toFixed(4));
      
      const margin80 = Number((1.282 * rmse * Math.sqrt(1 + 0.1 * h)).toFixed(4));
      const margin95 = Number((1.960 * rmse * Math.sqrt(1 + 0.1 * h)).toFixed(4));

      points.push({
        period: `Projected +${h}`,
        projectedValue: forecastVal,
        lowerBound80: Number((forecastVal - margin80).toFixed(4)),
        upperBound80: Number((forecastVal + margin80).toFixed(4)),
        lowerBound95: Number((forecastVal - margin95).toFixed(4)),
        upperBound95: Number((forecastVal + margin95).toFixed(4)),
        lowerBound: Number((forecastVal - margin95).toFixed(4)),
        upperBound: Number((forecastVal + margin95).toFixed(4)),
      });
    }

    return {
      metricId,
      metricName,
      modelType: "HOLT_WINTERS_ADDITIVE",
      detectedPeriodicity: L,
      historicalPoints: history,
      points,
      goodnessOfFit: {
        mae: Number(mae.toFixed(4)),
        rmse: Number(rmse.toFixed(4)),
      },
    };
  }

  /**
   * Holt's Linear Double Exponential Smoothing (Trend without Seasonality)
   */
  public static generateHoltLinear(
    metricId: string,
    metricName: string,
    history: DataPoint[],
    periodsToForecast: number = 3
  ): ForecastResult {
    const n = history.length;
    const y = history.map((p) => p.value);
    const alpha = 0.3;
    const beta = 0.1;

    let level = y[0];
    let trend = y[1] - y[0];

    let sumAbsErr = 0;
    let sumSqErr = 0;

    for (let t = 1; t < n; t++) {
      const yHat = level + trend;
      const err = y[t] - yHat;
      sumAbsErr += Math.abs(err);
      sumSqErr += err * err;

      const prevLevel = level;
      level = alpha * y[t] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    const mae = sumAbsErr / Math.max(1, n - 1);
    const rmse = Math.sqrt(sumSqErr / Math.max(1, n - 1));

    const points: ForecastPoint[] = [];
    for (let h = 1; h <= periodsToForecast; h++) {
      const forecastVal = Number((level + h * trend).toFixed(4));
      const margin80 = Number((1.282 * rmse * Math.sqrt(1 + 0.15 * h)).toFixed(4));
      const margin95 = Number((1.960 * rmse * Math.sqrt(1 + 0.15 * h)).toFixed(4));

      points.push({
        period: `Projected +${h}`,
        projectedValue: forecastVal,
        lowerBound80: Number((forecastVal - margin80).toFixed(4)),
        upperBound80: Number((forecastVal + margin80).toFixed(4)),
        lowerBound95: Number((forecastVal - margin95).toFixed(4)),
        upperBound95: Number((forecastVal + margin95).toFixed(4)),
        lowerBound: Number((forecastVal - margin95).toFixed(4)),
        upperBound: Number((forecastVal + margin95).toFixed(4)),
      });
    }

    return {
      metricId,
      metricName,
      modelType: "HOLT_LINEAR",
      historicalPoints: history,
      points,
      goodnessOfFit: {
        mae: Number(mae.toFixed(4)),
        rmse: Number(rmse.toFixed(4)),
      },
    };
  }
}



