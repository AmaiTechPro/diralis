import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserEntitlements,
  hasFeature,
  getUsageLimit,
} from "../billingService";
import prisma from "../../lib/prisma";

vi.mock("../../lib/prisma", () => ({
  default: {
    subscription: {
      findFirst: vi.fn(),
    },
    subscriptionPlan: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("Billing Service Entitlements & Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct feature availability when enabled", async () => {
    (prisma.subscription.findFirst as any).mockResolvedValue({
      id: "sub-123",
      currentKey: "user-123_current",
      status: "ACTIVE",
      plan: {
        id: "plan-pro",
        code: "PRO",
        name: "Pro Plan",
        features: { advancedAnalytics: true, exportPdf: true },
        limits: { maxProjects: 20 },
      },
    });

    const isAllowed = await hasFeature("user-123", "advancedAnalytics");
    expect(isAllowed).toBe(true);

    const isDenied = await hasFeature("user-123", "nonExistentFeature");
    expect(isDenied).toBe(false);
  });

  it("should return correct usage limits", async () => {
    (prisma.subscription.findFirst as any).mockResolvedValue({
      id: "sub-123",
      currentKey: "user-123_current",
      status: "ACTIVE",
      plan: {
        id: "plan-pro",
        code: "PRO",
        name: "Pro Plan",
        features: {},
        limits: { maxProjects: 20, maxTeamMembers: null },
      },
    });

    const limit = await getUsageLimit("user-123", "maxProjects");
    expect(limit).toBe(20);

    const unlimited = await getUsageLimit("user-123", "maxTeamMembers");
    expect(unlimited).toBeNull();
  });

  it("should fallback to FREE plan entitlements when user has no active subscription", async () => {
    (prisma.subscription.findFirst as any).mockResolvedValue(null);

    (prisma.subscriptionPlan.findFirst as any).mockResolvedValue({
      id: "plan-free",
      code: "FREE",
      name: "Free Tier",
      features: { basicSearch: true },
      limits: { maxProjects: 3 },
    });

    const entitlements = await getUserEntitlements("user-123");
    expect(entitlements.plan.code).toBe("FREE");
    expect(entitlements.limits).toEqual({ maxProjects: 3 });
    expect(entitlements.features).toEqual({ basicSearch: true });
  });
});


