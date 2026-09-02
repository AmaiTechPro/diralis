import { randomUUID } from "crypto";

export type ObservabilityEventType =
  | "ENTITLEMENT_EVALUATED"
  | "COPILOT_TURN_STARTED"
  | "DETERMINISTIC_TOOL_EXECUTED"
  | "AI_PROVIDER_CALLED"
  | "FALLBACK_TRIGGERED"
  | "COPILOT_TURN_COMPLETED"
  | "MAP_PROFILE_REFRESHED"
  | "MAP_PROFILE_REFRESH_FAILED"
  | "SYNC_SCHEDULED"
  | "SYNC_COMPLETED";

export interface LogContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  datasetId?: string;
  [key: string]: any;
}

export interface StructuredLogPayload {
  timestamp: string;
  eventType: ObservabilityEventType;
  level: "INFO" | "WARN" | "ERROR";
  durationMs?: number;
  context: LogContext;
  data?: Record<string, any>;
}

export class CopilotLogger {
  public static createCorrelationId(): string {
    return `cpl_${randomUUID().replace(/-/g, "").substring(0, 16)}`;
  }

  public static log(
    eventType: ObservabilityEventType,
    context: LogContext,
    data?: Record<string, any>,
    durationMs?: number,
    level: "INFO" | "WARN" | "ERROR" = "INFO"
  ): StructuredLogPayload {
    const payload: StructuredLogPayload = {
      timestamp: new Date().toISOString(),
      eventType,
      level,
      ...(durationMs !== undefined ? { durationMs } : {}),
      context: {
        correlationId: context.correlationId || "unassigned",
        userId: context.userId || "anonymous",
        sessionId: context.sessionId,
        datasetId: context.datasetId,
        ...context,
      },
      ...(data ? { data } : {}),
    };

    if (process.env.NODE_ENV !== "test") {
      const output = JSON.stringify(payload);
      if (level === "ERROR") {
        console.error(output);
      } else if (level === "WARN") {
        console.warn(output);
      } else {
        console.log(output);
      }
    }

    return payload;
  }
}


