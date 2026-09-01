import { MetricEngine } from "../engines/metricEngine";
import { AnomalyEngine } from "../engines/anomalyEngine";
import { KeyDriverEngine } from "../engines/keyDriverEngine";
import { ForecastEngine } from "../engines/forecastEngine";
import { ScenarioEngine } from "../engines/scenarioEngine";
import { BlendingEngine, JoinType, JoinCondition } from "./blendingEngine";

export interface ToolContext {
  userId: string;
  datasetId: string;
  rows: Record<string, any>[];
  [key: string]: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (context: ToolContext, params: any) => Promise<any> | any;
}

export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  static {
    // 1. Compute Metric
    this.registerTool({
      name: "compute_metric",
      description: "Computes a single deterministic aggregated metric (SUM, AVG, COUNT, PERCENTAGE) on a column.",
      parameters: {
        definition: "MetricDefinition object describing expression and column target.",
      },
      execute: (ctx, params) => MetricEngine.computeMetric(params.definition, ctx.rows),
    });

    // 2. Detect Anomalies
    this.registerTool({
      name: "detect_anomalies",
      description: "Detects statistical outliers in numerical series using IQR and Z-Score bounds.",
      parameters: {
        metricId: "string",
        metricName: "string",
        data: "Array<{ id: string; label: string; value: number }>",
      },
      execute: (_ctx, params) => AnomalyEngine.detectOutliers(params.metricId, params.metricName, params.data),
    });

    // 3. Rank Key Drivers
    this.registerTool({
      name: "rank_key_drivers",
      description: "Decomposes variance contributions and ranks key drivers for a metric change.",
      parameters: {
        metricName: "string",
        totalDelta: "number",
        segmentDeltas: "Array<{ segment: string; deltaValue: number }>",
      },
      execute: (_ctx, params) => KeyDriverEngine.rankDrivers(params.metricName, params.totalDelta, params.segmentDeltas),
    });

    // 4. Generate Forecast
    this.registerTool({
      name: "generate_forecast",
      description: "Generates linear trend projection with bounded prediction intervals.",
      parameters: {
        metricId: "string",
        metricName: "string",
        historicalData: "Array<{ period: string; value: number }>",
        periodsToForecast: "number",
      },
      execute: (_ctx, params) => ForecastEngine.generateLinearTrend(params.metricId, params.metricName, params.historicalData, params.periodsToForecast),
    });

    // 5. Run Scenario
    this.registerTool({
      name: "run_scenario",
      description: "Simulates what-if parameter variations against an immutable dataset baseline.",
      parameters: {
        metric: "MetricDefinition object",
        adjustments: "Array<{ variableName: string; targetColumn: string; deltaPercentage: number }>",
      },
      execute: (ctx, params) => ScenarioEngine.evaluateWhatIf(params.metric, ctx.rows, params.adjustments),
    });

    // 6. Blend Datasets (Milestone 1)
    this.registerTool({
      name: "blend_datasets",
      description: "Deterministically joins or unions two tenant datasets in-memory.",
      parameters: {
        leftRows: "Array<Record<string, any>>",
        rightRows: "Array<Record<string, any>>",
        joinType: "INNER | LEFT | RIGHT | FULL | UNION",
        condition: "Optional { leftKey: string, rightKey: string }",
      },
      execute: (ctx, params) =>
        BlendingEngine.blend({
          leftDatasetId: ctx.datasetId,
          rightDatasetId: params.rightDatasetId || "dataset_2",
          leftRows: params.leftRows || ctx.rows,
          rightRows: params.rightRows || [],
          joinType: (params.joinType as JoinType) || "INNER",
          condition: params.condition as JoinCondition | undefined,
        }),
    });
  }

  public static registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public static getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public static listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public static async executeTool(name: string, context: ToolContext, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' is not registered in ToolRegistry.`);
    }
    return tool.execute(context, params);
  }
}


