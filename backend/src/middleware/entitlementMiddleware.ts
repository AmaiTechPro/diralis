import { Request, Response, NextFunction } from "express";
import { hasFeature, getUsageLimit } from "../services/billingService";
import { EntitlementService, EntitlementReasonCode } from "../services/entitlementService";

/**
 * Middleware to enforce feature flag access based on the user's active plan.
 * (Retained for legacy/route compatibility)
 */
export function requireFeature(featureName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          code: "AUTH_REQUIRED",
          message: "Unauthorized",
        });
      }

      const allowed = await hasFeature(userId, featureName);

      if (!allowed) {
        return res.status(403).json({
          code: "PLAN_NOT_ENTITLED",
          message: `Feature '${featureName}' is not available on your current plan. Please upgrade your subscription.`,
          feature: featureName,
        });
      }

      next();
    } catch (error) {
      console.error(`Entitlement check error for feature ${featureName}:`, error);
      return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "Failed to verify feature entitlement",
      });
    }
  };
}

/**
 * Middleware to enforce usage limits based on the user's active plan.
 * (Retained for legacy/route compatibility)
 */
export function enforceUsageLimit(
  resourceName: string,
  getCurrentUsage: (userId: string, req: Request) => Promise<number>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          code: "AUTH_REQUIRED",
          message: "Unauthorized",
        });
      }

      const limit = await getUsageLimit(userId, resourceName);

      // null means unlimited / custom enterprise plan
      if (limit === null) {
        return next();
      }

      const currentUsage = await getCurrentUsage(userId, req);

      if (currentUsage >= limit) {
        return res.status(403).json({
          code: "QUOTA_EXHAUSTED",
          message: `You have reached your monthly limit of ${limit} for '${resourceName}'. Upgrade your plan to continue.`,
          resource: resourceName,
          limit,
          currentUsage,
        });
      }

      next();
    } catch (error) {
      console.error(`Limit check error for resource ${resourceName}:`, error);
      return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "Failed to verify usage limits",
      });
    }
  };
}

/**
 * Unified 5-Tier Entitlement Guard (Milestone 2)
 * Evaluates Tenant Resource Ownership, Plan Entitlement, and Quota atomically.
 */
export interface UnifiedEntitlementOptions {
  feature?: string;
  quotaMetric?: "aiRequestsPerMonth" | "forecastsPerMonth" | "monthlyExports";
  datasetIdParam?: string;
  datasetIdBody?: string;
}

export function requireEntitlement(options: UnifiedEntitlementOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          code: "AUTH_REQUIRED",
          message: "Authentication required.",
        });
      }

      const datasetId =
        (options.datasetIdParam ? (req.params[options.datasetIdParam] as string) : undefined) ||
        (options.datasetIdBody ? (req.body[options.datasetIdBody] as string) : undefined);

      const decision = await EntitlementService.evaluate(userId, {
        requiredFeature: options.feature,
        quotaMetric: options.quotaMetric,
        datasetId,
      });

      if (!decision.allowed) {
        return res.status(decision.statusCode).json({
          code: decision.code,
          message: decision.message,
          details: decision.details,
        });
      }

      next();
    } catch (error) {
      console.error("Unified entitlement evaluation error:", error);
      return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "Failed to evaluate unified entitlement.",
      });
    }
  };
}


