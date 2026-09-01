import { MetricEngine } from "../engines/metricEngine";
import { AnomalyEngine } from "../engines/anomalyEngine";
import { KeyDriverEngine } from "../engines/keyDriverEngine";
import { ForecastEngine } from "../engines/forecastEngine";
import { ScenarioEngine } from "../engines/scenarioEngine";
import { MetricDefinition, ScenarioVariableInput } from "../engines/types";

export interface ToolContext {
  userId: string;
  datasetId: string;
  rows?: Record<string, any>[];
}

export interface RegisteredTool {
  name: string;
  description: string;
  requiredFeature: string;
  execute: (ctx: ToolContext, params: any) => Promise<any>;
}

export class ToolRegistry {
  private static tools: Map<string, RegisteredTool> = new Map();

  public static registerTool(tool: RegisteredTool) {
    this.tools.set(tool.name, tool);
  }

  public static getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  public static listTools(): { name: string; description: string; requiredFeature: string }[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      requiredFeature: t.requiredFeature,
    }));
  }

  public static async executeTool(name: string, ctx: ToolContext, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' is not registered.`);
    }
    return await tool.execute(ctx, params);
  }
}

// 1. Tool: compute_metric
ToolRegistry.registerTool({
  name: "compute_metric",
  description: "Computes a deterministic business metric across dataset rows.",
  requiredFeature: "analytics",
  execute: async (ctx, params: { definition: MetricDefinition }) => {
    return MetricEngine.computeMetric(params.definition, ctx.rows || []);
  },
});

// 2. Tool: detect_anomalies
ToolRegistry.registerTool({
  name: "detect_anomalies",
  description: "Scans data points for statistical outliers using IQR and Modified Z-Score.",
  requiredFeature: "analytics",
  execute: async (ctx, params: { metricId: string; metricName: string; dataPoints: any[] }) => {
    return AnomalyEngine.detectOutliers(params.metricId, params.metricName, params.dataPoints);
  },
});

// 3. Tool: rank_key_drivers
ToolRegistry.registerTool({
  name: "rank_key_drivers",
  description: "Identifies top contributing factors and correlations behind a metric shift.",
  requiredFeature: "analytics",
  execute: async (ctx, params: { targetMetric: string; totalDelta: number; segmentDeltas: any[] }) => {
    return KeyDriverEngine.rankDrivers(params.targetMetric, params.totalDelta, params.segmentDeltas);
  },
});

// 4. Tool: generate_forecast
ToolRegistry.registerTool({
  name: "generate_forecast",
  description: "Projects future linear trends with 80% and 95% confidence intervals.",
  requiredFeature: "analytics",
  execute: async (ctx, params: { metricId: string; metricName: string; history: any[]; horizon: number }) => {
    return ForecastEngine.generateLinearTrend(params.metricId, params.metricName, params.history, params.horizon);
  },
});

// 5. Tool: run_scenario
ToolRegistry.registerTool({
  name: "run_scenario",
  description: "Runs what-if sensitivity simulations under parameter variations.",
  requiredFeature: "analytics",
  execute: async (ctx, params: { definition: MetricDefinition; variables: ScenarioVariableInput[] }) => {
    return ScenarioEngine.evaluateWhatIf(params.definition, ctx.rows || [], params.variables);
  },
});

