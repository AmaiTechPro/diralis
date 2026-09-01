import { describe, it, expect } from "@jest/globals";
import { MetricEngine } from "../services/engines/metricEngine";
import { AnomalyEngine } from "../services/engines/anomalyEngine";
import { KeyDriverEngine } from "../services/engines/keyDriverEngine";
import { ForecastEngine } from "../services/engines/forecastEngine";
import { ScenarioEngine } from "../services/engines/scenarioEngine";

describe("Deterministic Core & Predictive Engines Suite", () => {
  describe("MetricEngine", () => {
    const sampleRows = [
      { revenue: 100, cost: 60, units: 10 },
      { revenue: 200, cost: 140, units: 20 },
      { revenue: 300, cost: 160, units: 30 },
    ];

    it("1. Computes deterministic SUM metric accurately", () => {
      const result = MetricEngine.computeMetric(
        {
          id: "total_rev",
          name: "Total Revenue",
          expression: "SUM",
          targetColumn: "revenue",
          format: "CURRENCY",
          unit: "$",
        },
        sampleRows
      );
      expect(result.value).toBe(600);
      expect(result.formattedValue).toBe("$600");
    });

    it("2. Computes deterministic RATIO / PERCENTAGE metric accurately", () => {
      const result = MetricEngine.computeMetric(
        {
          id: "gross_margin",
          name: "Gross Margin",
          expression: "PERCENTAGE",
          targetColumn: "cost",
          baseColumn: "revenue",
          format: "PERCENTAGE",
        },
        sampleRows
      );
      expect(result.value).toBe(60);
      expect(result.formattedValue).toBe("60.00%");
    });
  });

  describe("AnomalyEngine", () => {
    it("3. Detects high-deviation outliers via IQR and Z-Score without hallucinations", () => {
      const normalData = [
        { id: "1", label: "Jan", value: 100 },
        { id: "2", label: "Feb", value: 102 },
        { id: "3", label: "Mar", value: 98 },
        { id: "4", label: "Apr", value: 101 },
        { id: "5", label: "May", value: 103 },
        { id: "6", label: "Jun", value: 450 },
      ];

      const anomalies = AnomalyEngine.detectOutliers("rev", "Monthly Revenue", normalData);
      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      expect(anomalies[0].dimensionValue).toBe("Jun");
      expect(anomalies[0].severity).toBe("CRITICAL");
    });
  });

  describe("KeyDriverEngine", () => {
    it("4. Decomposes variance contributions and calculates Pearson correlation accurately", () => {
      const segmentDeltas = [
        { segment: "North America", deltaValue: -80 },
        { segment: "Europe", deltaValue: -15 },
        { segment: "Asia", deltaValue: -5 },
      ];

      const driverResult = KeyDriverEngine.rankDrivers("Total Profit", -100, segmentDeltas);
      expect(driverResult.primaryDrivers[0].driverName).toBe("North America");
      expect(driverResult.primaryDrivers[0].contributionPercentage).toBe(80);

      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const r = KeyDriverEngine.calculatePearsonCorrelation(x, y);
      expect(r).toBe(1);
    });
  });

  describe("ForecastEngine", () => {
    it("5. Computes linear trend projection with bounded prediction intervals", () => {
      const history = [
        { period: "Q1", value: 100 },
        { period: "Q2", value: 120 },
        { period: "Q3", value: 140 },
        { period: "Q4", value: 160 },
      ];

      const forecast = ForecastEngine.generateLinearTrend("sales", "Sales Trend", history, 2);
      expect(forecast.points).toHaveLength(2);
      expect(forecast.points[0].projectedValue).toBe(180);
      expect(forecast.points[1].projectedValue).toBe(200);
      expect(forecast.goodnessOfFit.rSquared).toBe(1);
    });
  });

  describe("ScenarioEngine", () => {
    it("6. Computes what-if simulation adjustments without mutating raw data", () => {
      const rows = [
        { revenue: 1000, shipping_cost: 100 },
        { revenue: 2000, shipping_cost: 200 },
      ];

      const metricDef: any = {
        id: "total_shipping",
        name: "Total Shipping Cost",
        expression: "SUM",
        targetColumn: "shipping_cost",
        format: "CURRENCY",
      };

      // Simulate a +10% increase in shipping costs
      const result = ScenarioEngine.evaluateWhatIf(metricDef, rows, [
        {
          variableName: "Shipping Rate Inflation",
          targetColumn: "shipping_cost",
          deltaPercentage: 0.1,
        },
      ]);

      expect(result.baselineValue).toBe(300);
      expect(result.simulatedValue).toBe(330);
      expect(result.absoluteDifference).toBe(30);
      expect(result.percentageDifference).toBe(10);
      expect(rows[0].shipping_cost).toBe(100); // Verify immutable baseline
    });
  });
});


