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
}

