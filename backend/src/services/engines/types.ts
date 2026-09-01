export interface MetricDefinition {
  id: string;
  name: string;
  expression: "SUM" | "AVG" | "COUNT" | "RATIO" | "PERCENTAGE";
  targetColumn: string;
  baseColumn?: string; // For ratios/percentages (e.g. numerator / denominator)
  format: "CURRENCY" | "PERCENTAGE" | "NUMBER" | "INTEGER";
  unit?: string;
}

export interface MetricResult {
  metricId: string;
  name: string;
  value: number;
  formattedValue: string;
  format: "CURRENCY" | "PERCENTAGE" | "NUMBER" | "INTEGER";
  unit?: string;
  isDeterministic: true;
}

export interface AnomalyRecord {
  id: string;
  metricId: string;
  metricName: string;
  dimensionKey?: string;
  dimensionValue?: string;
  period?: string;
  observedValue: number;
  expectedValue: number;
  deltaPercentage: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detectionMethod: "MODIFIED_Z_SCORE" | "IQR_OUTLIER" | "PERCENTAGE_DEVIATION";
  confidence: number;
  evidence: string;
}

export interface KeyDriver {
  driverName: string;
  dimensionKey?: string;
  dimensionValue?: string;
  contributionPercentage: number; // e.g. 45.2%
  correlationCoefficient?: number; // Pearson r
  direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  evidenceText: string;
}

export interface DriverAnalysisResult {
  targetMetric: string;
  observedDelta: number;
  primaryDrivers: KeyDriver[];
  unexplainedVariancePercentage: number;
}


export interface ForecastPoint {
  period: string;
  projectedValue: number;
  lowerBound80: number;
  upperBound80: number;
  lowerBound95: number;
  upperBound95: number;
}

export interface ForecastResult {
  metricId: string;
  metricName: string;
  algorithm: "LINEAR_REGRESSION" | "WEIGHTED_MOVING_AVERAGE";
  historicalPeriodsCount: number;
  forecastHorizonCount: number;
  points: ForecastPoint[];
  goodnessOfFit: { rSquared?: number; mape?: number };
  limitationsNotice: string;
  isDeterministic: true;
}

export interface ScenarioVariableInput {
  variableName: string;
  targetColumn: string;
  deltaPercentage: number; // e.g. 0.05 for +5%
}

export interface ScenarioResult {
  scenarioId: string;
  targetMetricName: string;
  baselineValue: number;
  simulatedValue: number;
  absoluteDifference: number;
  percentageDifference: number;
  variablesApplied: ScenarioVariableInput[];
  isSimulation: true;
  simulatedAt: string;
}



