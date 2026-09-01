export type CopilotResponseStatus =
  | "SUCCESS"
  | "PARTIAL_SUCCESS"
  | "DETERMINISTIC_FALLBACK"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "TOOL_FAILURE"
  | "MAP_UNAVAILABLE"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR";

export type AIProviderState =
  | "AVAILABLE"
  | "TIMEOUT"
  | "UNAVAILABLE"
  | "RATE_LIMITED"
  | "INVALID_RESPONSE";

export type AnalyticalState =
  | "AVAILABLE"
  | "NOT_APPLICABLE"
  | "INSUFFICIENT_DATA"
  | "STALE"
  | "UNAVAILABLE";

export interface AIStatusMetadata {
  available: boolean;
  providerState: AIProviderState;
  source: "LLM_SYNTHESIS" | "DETERMINISTIC_ENGINE" | "NONE";
  quotaConsumed: boolean;
  latencyMs?: number;
}

export interface AnalyticalStatusMetadata {
  available: boolean;
  state: AnalyticalState;
  mapVersion?: number;
  toolsExecuted: string[];
}

export interface StructuredCopilotResponse<T = any> {
  status: CopilotResponseStatus;
  summary: string;
  data?: T;
  ai: AIStatusMetadata;
  analytical: AnalyticalStatusMetadata;
  evidence: any[];
  insights: any[];
  recommendations: any[];
  warnings: string[];
  retryable: boolean;
  timestamp: string;
}

export type ProactiveAnalysisStatus =
  | "COMPLETED"
  | "NO_ANOMALIES_DETECTED"
  | "INSUFFICIENT_DATA"
  | "ANALYSIS_FAILED";

export interface ProactiveAnalysisResult {
  status: ProactiveAnalysisStatus;
  insightsCreated: number;
  message: string;
  durationMs: number;
}


