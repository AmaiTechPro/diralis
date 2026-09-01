import { describe, it, expect } from "vitest";
import { ForecastEngine } from "../services/engines/forecastEngine";
import { MultiDriverEngine } from "../services/engines/multiDriverEngine";
import { ToolRegistry } from "../services/copilot/toolRegistry";

describe("Phase 3.2 — Milestone 2: Advanced Time-Series & Multi-Driver Suite", () => {
  describe("ForecastEngine — Holt-Winters & Seasonality", () => {
    // 8 quarters of seasonal data with trend: Q1 baseline 100, Q2 120, Q3 80, Q4 150 + trend (+10/yr)
    const quarterlyHistory = [
      { period: "2024-Q1", value: 100 },
      { period: "2024-Q2", value: 120 },
      { period: "2024-Q3", value: 80 },
      { period: "2024-Q4", value: 150 },
      { period: "2025-Q1", value: 110 },
      { period: "2025-Q2", value: 130 },
      { period: "2025-Q3", value: 90 },
      { period: "2025-Q4", value: 160 },
    ];

    it("1. Correctly auto-detects quarterly seasonality period L = 4", () => {
      const detectedL = ForecastEngine.detectSeasonalityPeriod(quarterlyHistory);
      expect(detectedL).toBe(4);
    });

    it("2. Generates Holt-Winters additive seasonal forecast preserving pattern", () => {
      const res = ForecastEngine.generateSeasonalForecast(
        "rev",
        "Quarterly Revenue",
        quarterlyHistory,
        4
      );

      expect(res.modelType).toBe("HOLT_WINTERS_ADDITIVE");
      expect(res.detectedPeriodicity).toBe(4);
      expect(res.points).toHaveLength(4);

      // Q4 (highest) should be strictly greater than Q3 (lowest) in forecast
      const q3Forecast = res.points[2].projectedValue;
      const q4Forecast = res.points[3].projectedValue;
      expect(q4Forecast).toBeGreaterThan(q3Forecast);
    });

    it("3. Guarantees mathematical order of prediction intervals (lower95 <= lower80 <= yHat <= upper80 <= upper95)", () => {
      const res = ForecastEngine.generateSeasonalForecast(
        "rev",
        "Quarterly Revenue",
        quarterlyHistory,
        2
      );

      for (const pt of res.points) {
        expect(pt.lowerBound95!).toBeLessThanOrEqual(pt.lowerBound80!);
        expect(pt.lowerBound80!).toBeLessThanOrEqual(pt.projectedValue);
        expect(pt.projectedValue).toBeLessThanOrEqual(pt.upperBound80!);
        expect(pt.upperBound80!).toBeLessThanOrEqual(pt.upperBound95!);
      }
    });

    it("4. Gracefully degrades to Holt Linear when history is insufficient (< 2*L)", () => {
      const shortHistory = [
        { period: "2025-01", value: 50 },
        { period: "2025-02", value: 55 },
        { period: "2025-03", value: 60 },
        { period: "2025-04", value: 65 },
        { period: "2025-05", value: 70 },
      ];

      const res = ForecastEngine.generateSeasonalForecast("vol", "Short Series", shortHistory, 2);
      expect(res.modelType).toBe("HOLT_LINEAR");
      expect(res.points).toHaveLength(2);
      expect(res.points[1].projectedValue).toBeGreaterThan(res.points[0].projectedValue);
    });
  });

  describe("MultiDriverEngine — Deterministic OLS & VIF", () => {
    // Known linear system: Y = 10 + 2*X1 - 3*X2 (perfect fit)
    const exactRows = [
      { y: 10 + 2 * 1 - 3 * 2, x1: 1, x2: 2 }, // 6
      { y: 10 + 2 * 2 - 3 * 3, x1: 2, x2: 3 }, // 5
      { y: 10 + 2 * 3 - 3 * 1, x1: 3, x2: 1 }, // 13
      { y: 10 + 2 * 4 - 3 * 5, x1: 4, x2: 5 }, // 3
      { y: 10 + 2 * 5 - 3 * 2, x1: 5, x2: 2 }, // 14
      { y: 10 + 2 * 6 - 3 * 4, x1: 6, x2: 4 }, // 10
    ];

    it("5. Computes exact OLS coefficients, intercept, and R^2 for multiple predictors", () => {
      const res = MultiDriverEngine.analyzeMultiVariableDrivers("y", ["x1", "x2"], exactRows);
      
      expect(res.status).toBe("SUCCESS");
      expect(res.intercept).toBeCloseTo(10, 2);
      expect(res.rSquared).toBeCloseTo(1.0, 2);
      expect(res.adjustedRSquared).toBeCloseTo(1.0, 2);

      const dX1 = res.drivers.find((d) => d.featureName === "x1");
      const dX2 = res.drivers.find((d) => d.featureName === "x2");

      expect(dX1?.rawCoefficient).toBeCloseTo(2.0, 2);
      expect(dX1?.direction).toBe("POSITIVE");
      expect(dX2?.rawCoefficient).toBeCloseTo(-3.0, 2);
      expect(dX2?.direction).toBe("NEGATIVE");
    });

    it("6. Calculates VIF and alerts on high multicollinearity", () => {
      // Create collinear dataset: x2 is nearly identical to 2*x1
      const collinearRows = [
        { y: 10, x1: 1, x2: 2.01 },
        { y: 20, x1: 2, x2: 4.02 },
        { y: 30, x1: 3, x2: 5.99 },
        { y: 40, x1: 4, x2: 8.01 },
        { y: 50, x1: 5, x2: 10.02 },
      ];

      const res = MultiDriverEngine.analyzeMultiVariableDrivers("y", ["x1", "x2"], collinearRows);
      expect(res.status).toBe("SUCCESS");
      expect(res.warnings.length).toBeGreaterThan(0);
      expect(res.drivers[0].vif).toBeGreaterThan(5); // Collinearity detected
    });

    it("7. Handles insufficient observations safely with typed status code", () => {
      const sparseRows = [
        { y: 10, x1: 1, x2: 2 },
        { y: 20, x1: 2, x2: 3 },
      ];

      const res = MultiDriverEngine.analyzeMultiVariableDrivers("y", ["x1", "x2"], sparseRows);
      expect(res.status).toBe("INSUFFICIENT_OBSERVATIONS");
      expect(res.drivers).toHaveLength(0);
    });

    it("8. Executes analyze_multivariable_drivers via ToolRegistry", async () => {
      const res = await ToolRegistry.executeTool(
        "analyze_multivariable_drivers",
        {
          userId: "test_user",
          datasetId: "ds_1",
          rows: exactRows,
        },
        {
          targetName: "y",
          featureNames: ["x1", "x2"],
        }
      );

      expect(res.status).toBe("SUCCESS");
      expect(res.drivers.length).toBe(2);
    });
  });
});



