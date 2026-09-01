import { ScenarioResult, ScenarioVariableInput, MetricDefinition } from "./types";
import { MetricEngine } from "./metricEngine";

export class ScenarioEngine {
  /**
   * Executes deterministic what-if sensitivity simulations without mutating original rows.
   */
  public static evaluateWhatIf(
    metricDef: MetricDefinition,
    rows: Record<string, any>[],
    variables: ScenarioVariableInput[]
  ): ScenarioResult {
    // 1. Calculate historical baseline
    const baseline = MetricEngine.computeMetric(metricDef, rows);

    // 2. Clone and adjust rows deterministically according to simulated parameter shifts
    const simulatedRows = rows.map((row) => {
      const adjustedRow = { ...row };
      variables.forEach((variable) => {
        if (adjustedRow[variable.targetColumn] !== undefined) {
          const original = Number(adjustedRow[variable.targetColumn]);
          if (!isNaN(original)) {
            adjustedRow[variable.targetColumn] = original * (1 + variable.deltaPercentage);
          }
        }
      });
      return adjustedRow;
    });

    // 3. Compute metric on simulated data
    const simulated = MetricEngine.computeMetric(metricDef, simulatedRows);

    const absDiff = simulated.value - baseline.value;
    const pctDiff = baseline.value !== 0 ? (absDiff / baseline.value) * 100 : 0;

    return {
      scenarioId: `sim_${Date.now()}`,
      targetMetricName: metricDef.name,
      baselineValue: baseline.value,
      simulatedValue: simulated.value,
      absoluteDifference: Math.round(absDiff * 100) / 100,
      percentageDifference: Math.round(pctDiff * 10) / 10,
      variablesApplied: variables,
      isSimulation: true,
      simulatedAt: new Date().toISOString(),
    };
  }
}

