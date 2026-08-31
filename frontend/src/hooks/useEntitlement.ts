import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getBillingOverview,
  type BillingOverview,
  type PlanFeatures,
  type PlanLimits,
  type PlanUsageMetrics,
} from "../services/billingService";

export type PlanTierCode = "FREE" | "STARTER" | "PRO" | "BUSINESS" | "CUSTOM";

export const PLAN_TIER_RANK: Record<PlanTierCode, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  BUSINESS: 3,
  CUSTOM: 4,
};

export interface EntitlementState {
  loading: boolean;
  error: string | null;
  overview: BillingOverview | null;
  currentTier: PlanTierCode;
  features: PlanFeatures;
  limits: PlanLimits;
  usage: PlanUsageMetrics;
  hasFeature: (featureName: keyof PlanFeatures | string) => boolean;
  meetsMinimumTier: (minimumTier: PlanTierCode) => boolean;
  isFeatureAvailable: (
    featureName?: keyof PlanFeatures | string,
    minimumTier?: PlanTierCode
  ) => boolean;
  getLimit: (limitName: keyof PlanLimits | string) => number | null;
  getUsage: (resourceName: keyof PlanUsageMetrics | string) => number;
  getRemaining: (resourceName: string) => number | null;
  isUsageExceeded: (resourceName: string) => boolean;
  refresh: () => Promise<void>;
}

export function useEntitlement(): EntitlementState {
  const { token } = useAuth();
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!token) {
      setOverview(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getBillingOverview();
      setOverview(data);
    } catch (err) {
      console.error("Failed to load entitlements:", err);
      setError("Unable to load subscription entitlements.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const currentTier: PlanTierCode = (overview?.plan?.code as PlanTierCode) || "FREE";
  const features: PlanFeatures = overview?.entitlements?.features || {};
  const limits: PlanLimits = overview?.entitlements?.limits || {};
  const usage: PlanUsageMetrics = overview?.usage || {
    datasets: 0,
    storageMb: 0,
    aiRequestsPerMonth: 0,
    monthlyExports: 0,
    forecastsPerMonth: 0,
    teamMembers: 1,
  };

  const meetsMinimumTier = useCallback(
    (minimumTier: PlanTierCode): boolean => {
      // Custom enterprise plans can configure specific tiers or evaluate higher rank
      const currentRank = PLAN_TIER_RANK[currentTier] ?? 0;
      const targetRank = PLAN_TIER_RANK[minimumTier] ?? 0;
      return currentRank >= targetRank;
    },
    [currentTier]
  );

  const hasFeature = useCallback(
    (featureName: keyof PlanFeatures | string): boolean => {
      if (!overview) return false;
      // For CUSTOM plan: if the feature is explicitly set to false, it is denied
      if (features[featureName as keyof PlanFeatures] !== undefined) {
        return Boolean(features[featureName as keyof PlanFeatures]);
      }
      return false;
    },
    [overview, features]
  );

  const isFeatureAvailable = useCallback(
    (
      featureName?: keyof PlanFeatures | string,
      minimumTier?: PlanTierCode
    ): boolean => {
      if (!overview) return false;

      // 1. If an explicit boolean feature key is given, check it
      if (featureName && !hasFeature(featureName)) {
        return false;
      }

      // 2. If a minimum tier is required, check tier hierarchy
      if (minimumTier && !meetsMinimumTier(minimumTier)) {
        return false;
      }

      return true;
    },
    [overview, hasFeature, meetsMinimumTier]
  );

  const getLimit = useCallback(
    (limitName: keyof PlanLimits | string): number | null => {
      const val = limits[limitName as keyof PlanLimits];
      if (val === undefined || val === null) return null; // unlimited
      return typeof val === "number" ? val : null;
    },
    [limits]
  );

  const getUsage = useCallback(
    (resourceName: keyof PlanUsageMetrics | string): number => {
      return usage[resourceName as keyof PlanUsageMetrics] ?? 0;
    },
    [usage]
  );

  const getRemaining = useCallback(
    (resourceName: string): number | null => {
      const limit = getLimit(resourceName);
      if (limit === null) return null; // unlimited
      const current = getUsage(resourceName);
      return Math.max(0, limit - current);
    },
    [getLimit, getUsage]
  );

  const isUsageExceeded = useCallback(
    (resourceName: string): boolean => {
      const limit = getLimit(resourceName);
      if (limit === null) return false;
      const current = getUsage(resourceName);
      return current >= limit;
    },
    [getLimit, getUsage]
  );

  return {
    loading,
    error,
    overview,
    currentTier,
    features,
    limits,
    usage,
    hasFeature,
    meetsMinimumTier,
    isFeatureAvailable,
    getLimit,
    getUsage,
    getRemaining,
    isUsageExceeded,
    refresh: fetchOverview,
  };
}


