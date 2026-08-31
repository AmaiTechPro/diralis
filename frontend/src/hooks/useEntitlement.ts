import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getBillingOverview,
  type BillingOverview,
  type PlanFeatures,
  type PlanLimits,
  type PlanUsageMetrics,
} from "../services/billingService";

export interface EntitlementState {
  loading: boolean;
  error: string | null;
  overview: BillingOverview | null;
  features: PlanFeatures;
  limits: PlanLimits;
  usage: PlanUsageMetrics;
  hasFeature: (featureName: keyof PlanFeatures | string) => boolean;
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

  const hasFeature = useCallback(
    (featureName: keyof PlanFeatures | string): boolean => {
      if (!overview) return false;
      return Boolean(features[featureName as keyof PlanFeatures]);
    },
    [overview, features]
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
    features,
    limits,
    usage,
    hasFeature,
    getLimit,
    getUsage,
    getRemaining,
    isUsageExceeded,
    refresh: fetchOverview,
  };
}


