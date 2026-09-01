import prisma from "../lib/prisma";
import { getUserPlan, getUserUsageMetrics, getUsageLimit, hasFeature } from "./billingService";

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
  /**
   * Evaluates whether a user is entitled to access a specific capability and has quota available.
   */
  public static async evaluate(
    userId: string,
    options: {
      requiredFeature?: string;
      quotaMetric?: "aiRequestsPerMonth" | "forecastsPerMonth" | "monthlyExports";
      datasetId?: string;
    }
  ): Promise<EntitlementDecision> {
    if (!userId) {
      return {
        allowed: false,
        statusCode: 401,
        code: "AUTH_REQUIRED",
        message: "Authentication is required to perform this action.",
      };
    }

    // 1. Verify Dataset Resource Ownership (Tenant Isolation)
    if (options.datasetId) {
      const dataset = await prisma.dataset.findFirst({
        where: { id: options.datasetId, userId },
      });
      if (!dataset) {
        return {
          allowed: false,
          statusCode: 404,
          code: "RESOURCE_UNAUTHORIZED",
          message: "The requested dataset was not found in your workspace.",
        };
      }
    }

    const plan = await getUserPlan(userId);
    const planCode = plan?.code || "FREE";

    // 2. Plan-Tier Feature Entitlement Check
    if (options.requiredFeature) {
      const featureEnabled = await hasFeature(userId, options.requiredFeature);
      if (!featureEnabled) {
        return {
          allowed: false,
          statusCode: 403,
          code: "PLAN_NOT_ENTITLED",
          message: `The '${options.requiredFeature}' capability requires a plan upgrade. Current plan: ${planCode}.`,
          details: {
            requiredFeature: options.requiredFeature,
            tier: planCode,
          },
        };
      }
    }

    // 3. Quota Evaluation
    if (options.quotaMetric) {
      const usage = await getUserUsageMetrics(userId);
      const limit = await getUsageLimit(userId, options.quotaMetric);

      const currentUsage = usage[options.quotaMetric] || 0;
      if (limit !== null && currentUsage >= limit) {
        return {
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
      }
    }

    return { allowed: true, statusCode: 200 };
  }
}