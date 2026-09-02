import prisma from "../lib/prisma";
import { getUserPlan, getUserUsageMetrics, getUsageLimit, hasFeature } from "./billingService";
import { CopilotLogger } from "./copilot/copilotLogger";

export type EntitlementReasonCode =
  | "AUTH_REQUIRED"
  | "RESOURCE_UNAUTHORIZED"
  | "PLAN_NOT_ENTITLED"
  | "QUOTA_EXHAUSTED"
  | "FEATURE_DISABLED";

export interface EntitlementDecision {
  allowed: boolean;
  statusCode: number;
  code?: EntitlementReasonCode;
  message?: string;
  details?: {
    currentUsage?: number;
    quotaLimit?: number | null;
    requiredFeature?: string;
    tier?: string;
  };
}

export class EntitlementService {
  public static async evaluate(
    userId: string,
    options: {
      requiredFeature?: string;
      quotaMetric?: "aiRequestsPerMonth" | "forecastsPerMonth" | "monthlyExports";
      datasetId?: string;
      correlationId?: string;
    }
  ): Promise<EntitlementDecision> {
    const correlationId = options.correlationId || CopilotLogger.createCorrelationId();

    if (!userId) {
      const decision: EntitlementDecision = {
        allowed: false,
        statusCode: 401,
        code: "AUTH_REQUIRED",
        message: "Authentication is required to perform this action.",
      };
      CopilotLogger.log("ENTITLEMENT_EVALUATED", { correlationId, userId }, { decision }, undefined, "WARN");
      return decision;
    }

    // 1. Verify Dataset Resource Ownership (Tenant Isolation)
    if (options.datasetId) {
      const dataset = await prisma.dataset.findFirst({
        where: { id: options.datasetId, userId },
      });
      if (!dataset) {
        const decision: EntitlementDecision = {
          allowed: false,
          statusCode: 404,
          code: "RESOURCE_UNAUTHORIZED",
          message: "The requested dataset was not found in your workspace.",
        };
        CopilotLogger.log("ENTITLEMENT_EVALUATED", { correlationId, userId, datasetId: options.datasetId }, { decision }, undefined, "WARN");
        return decision;
      }
    }

    const plan = await getUserPlan(userId);
    const planCode = plan?.code || "FREE";

    // 2. Plan-Tier Feature Entitlement Check
    if (options.requiredFeature) {
      const featureEnabled = await hasFeature(userId, options.requiredFeature);
      if (!featureEnabled) {
        const decision: EntitlementDecision = {
          allowed: false,
          statusCode: 403,
          code: "PLAN_NOT_ENTITLED",
          message: `The '${options.requiredFeature}' capability requires a plan upgrade. Current plan: ${planCode}.`,
          details: {
            requiredFeature: options.requiredFeature,
            tier: planCode,
          },
        };
        CopilotLogger.log("ENTITLEMENT_EVALUATED", { correlationId, userId }, { decision }, undefined, "WARN");
        return decision;
      }
    }

    // 3. Quota Evaluation
    if (options.quotaMetric) {
      const usage = await getUserUsageMetrics(userId);
      const limit = await getUsageLimit(userId, options.quotaMetric);

      const currentUsage = usage[options.quotaMetric] || 0;
      if (limit !== null && currentUsage >= limit) {
        const decision: EntitlementDecision = {
          allowed: false,
          statusCode: 403,
          code: "QUOTA_EXHAUSTED",
          message: `Monthly quota for '${options.quotaMetric}' has been exhausted (${currentUsage}/${limit}).`,
          details: {
            currentUsage,
            quotaLimit: limit,
            tier: planCode,
          },
        };
        CopilotLogger.log("ENTITLEMENT_EVALUATED", { correlationId, userId }, { decision }, undefined, "WARN");
        return decision;
      }
    }

    const allowedDecision: EntitlementDecision = { allowed: true, statusCode: 200 };
    CopilotLogger.log("ENTITLEMENT_EVALUATED", { correlationId, userId }, { decision: allowedDecision, tier: planCode });
    return allowedDecision;
  }

  /**
   * Evaluates if a tenant can configure or activate external connectors based on their 5-tier plan.
   * FREE: 0 connectors (manual upload only)
   * STARTER: 1 connector
   * PRO: 3 connectors
   * BUSINESS: unlimited (-1)
   * CUSTOM: unlimited (-1)
   */
  public static async evaluateConnectorAccess(
    userId: string,
    options?: { correlationId?: string }
  ): Promise<EntitlementDecision> {
    const correlationId = options?.correlationId || CopilotLogger.createCorrelationId();

    if (!userId) {
      const decision: EntitlementDecision = {
        allowed: false,
        statusCode: 401,
        code: "AUTH_REQUIRED",
        message: "Authentication is required to perform this action.",
      };
      CopilotLogger.log("ENTITLEMENT_EVALUATED", { correlationId, userId }, { decision }, undefined, "WARN");
      return decision;
    }

    const plan = await getUserPlan(userId);
    const planCode = plan?.code || "FREE";

    const defaultLimits: Record<string, number> = {
      FREE: 0,
      STARTER: 1,
      PRO: 3,
      BUSINESS: -1,
      CUSTOM: -1,
    };

    const configuredLimit = await getUsageLimit(userId, "maxActiveConnectors");
    const maxAllowed = configuredLimit !== null ? configuredLimit : (defaultLimits[planCode] ?? 0);

    if (maxAllowed === 0) {
      const decision: EntitlementDecision = {
        allowed: false,
        statusCode: 403,
        code: "PLAN_NOT_ENTITLED",
        message: "Automated business data connectors require a Starter or higher tier.",
        details: { tier: planCode, quotaLimit: 0 },
      };
      CopilotLogger.log("ENTITLEMENT_EVALUATED", { correlationId, userId }, { decision }, undefined, "WARN");
      return decision;
    }

    if (maxAllowed !== -1) {
      const currentCount = await (prisma as any).integrationConnection.count({
        where: { userId, status: "ACTIVE" },
      });

      if (currentCount >= maxAllowed) {
        const decision: EntitlementDecision = {
          allowed: false,
          statusCode: 403,
          code: "QUOTA_EXHAUSTED",
          message: `Maximum active connectors limit (${maxAllowed}) reached for your plan.`,
          details: { currentUsage: currentCount, quotaLimit: maxAllowed, tier: planCode },
        };
        CopilotLogger.log("ENTITLEMENT_EVALUATED", { correlationId, userId }, { decision }, undefined, "WARN");
        return decision;
      }
    }

    const decision: EntitlementDecision = {
      allowed: true,
      statusCode: 200,
      details: { tier: planCode, quotaLimit: maxAllowed },
    };
    CopilotLogger.log("ENTITLEMENT_EVALUATED", { correlationId, userId }, { decision, tier: planCode });
    return decision;
  }
}


