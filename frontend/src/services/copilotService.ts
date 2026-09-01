import api from "./api"; // adjust to your local api instance path if named differently (e.g. '../services/api')

export interface CopilotInsightItem {
  id: string;
  datasetId: string;
  type: "ANOMALY" | "DRIVER" | "TREND" | "OPPORTUNITY";
  severity: "INFO" | "POSITIVE" | "WARNING" | "HIGH" | "CRITICAL";
  title: string;
  metricName: string;
  observedValue: number;
  expectedValue: number | null;
  deltaPercentage: number | null;
  narrative: string;
  evidenceJson: string[];
  createdAt: string;
}

export interface ScenarioSimulationPayload {
  definition: {
    id: string;
    name: string;
    expression: "SUM" | "AVG" | "PERCENTAGE";
    targetColumn: string;
    baseColumn?: string;
    format: "CURRENCY" | "PERCENTAGE" | "NUMBER";
    unit?: string;
  };
  variables: {
    variableName: string;
    targetColumn: string;
    deltaPercentage: number;
  }[];
}

export interface ScenarioSimulationResult {
  scenarioId: string;
  targetMetricName: string;
  baselineValue: number;
  simulatedValue: number;
  absoluteDifference: number;
  percentageDifference: number;
  isSimulation: true;
  simulatedAt: string;
}

export const copilotService = {
  async getFeed(datasetId: string): Promise<{ insights: CopilotInsightItem[] }> {
    const res = await api.get<{ insights: CopilotInsightItem[] }>(`/copilot/feed/${datasetId}`);
    return res.data;
  },

  async dismissInsight(insightId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>(`/copilot/feed/${insightId}/dismiss`);
    return res.data;
  },
};

