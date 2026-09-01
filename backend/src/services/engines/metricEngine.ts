import { MetricDefinition, MetricResult } from "./types";

export class MetricEngine {
  /**
   * Computes a canonical metric from row-level dataset records or aggregated frequency lists.
   */
  public static computeMetric(
    definition: MetricDefinition,
    rows: Record<string, any>[]
  ): MetricResult {
    if (!rows || rows.length === 0) {
      return {
        metricId: definition.id,
        name: definition.name,
        value: 0,
        formattedValue: "0",
        format: definition.format,
        unit: definition.unit,
        isDeterministic: true,
      };
    }

    let calculatedValue = 0;

    switch (definition.expression) {
      case "SUM": {
        calculatedValue = rows.reduce((sum, row) => {
          const val = Number(row[definition.targetColumn]);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
        break;
      }
      case "AVG": {
        let validCount = 0;
        const total = rows.reduce((sum, row) => {
          const val = Number(row[definition.targetColumn]);
          if (!isNaN(val)) {
            validCount++;
            return sum + val;
          }
          return sum;
        }, 0);
        calculatedValue = validCount > 0 ? total / validCount : 0;
        break;
      }
      case "COUNT": {
        calculatedValue = rows.length;
        break;
      }
      case "RATIO":
      case "PERCENTAGE": {
        if (!definition.baseColumn) {
          calculatedValue = 0;
          break;
        }
        const num = rows.reduce((sum, row) => {
          const val = Number(row[definition.targetColumn]);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
        const den = rows.reduce((sum, row) => {
          const val = Number(row[definition.baseColumn!]);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
        const ratio = den !== 0 ? num / den : 0;
        calculatedValue = definition.expression === "PERCENTAGE" ? ratio * 100 : ratio;
        break;
      }
    }

    // Format output cleanly
    let formattedValue = calculatedValue.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
    if (definition.format === "PERCENTAGE") {
      formattedValue = `${calculatedValue.toFixed(2)}%`;
    } else if (definition.format === "CURRENCY") {
      formattedValue = `${definition.unit || "$"}${formattedValue}`;
    }

    return {
      metricId: definition.id,
      name: definition.name,
      value: Math.round(calculatedValue * 10000) / 10000,
      formattedValue,
      format: definition.format,
      unit: definition.unit,
      isDeterministic: true,
    };
  }
}

