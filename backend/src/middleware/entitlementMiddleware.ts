

import { Request, Response, NextFunction } from "express";
import { hasFeature, getUsageLimit } from "../services/billingService";

/**
 * Middleware to enforce feature flag access based on the user's active plan.
 * e.g., requireFeature("advancedAnalytics")
 */
export function requireFeature(featureName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const allowed = await hasFeature(userId, featureName);

      if (!allowed) {
        return res.status(403).json({
          message: `Feature '${featureName}' is not available on your current plan. Please upgrade your subscription.`,
          code: "FEATURE_NOT_PERMITTED",
          feature: featureName,
        });
      }

      next();
    } catch (error) {
      console.error(`Entitlement check error for feature ${featureName}:`, error);
      return res.status(500).json({
        message: "Failed to verify feature entitlement",
      });
    }
  };
}

/**
 * Middleware to enforce usage limits based on the user's active plan.
 * getCurrentUsage is a callback that computes current consumption for that user.
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
          message: `You have reached your monthly limit of ${limit} for '${resourceName}'. Upgrade your plan to continue.`,
          code: "USAGE_LIMIT_EXCEEDED",
          resource: resourceName,
          limit,
          currentUsage,
        });
      }

      next();
    } catch (error) {
      console.error(`Limit check error for resource ${resourceName}:`, error);
      return res.status(500).json({
        message: "Failed to verify usage limits",
      });
    }
  };
}


