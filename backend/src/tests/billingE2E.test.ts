import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import prisma from "../lib/prisma";
import {
  getBillingOverview,
  getUserEntitlements,
  getActivePlans,
} from "../services/billingService";
import { createCheckout } from "../services/billing/checkoutService";
import { processBillingWebhook } from "../services/billing/webhookService";
import { cancelUserSubscription } from "../services/billing/cancelSubscriptionService";
import { getBillingHistory } from "../services/billing/historyService";
import { BillingProvider, SubscriptionStatus, BillingInterval } from "@prisma/client";
import { PaystackProvider } from "../services/billing/providers/paystackProvider";

describe("End-to-End Billing Lifecycle Sandbox", () => {
  let testUserId: string;
  const timestamp = Date.now();
  const testEmail = `sandbox_test_${timestamp}@diralis.test`;
  const testUsername = `sandbox_${timestamp}`;

  beforeAll(async () => {
    // 1. Mock Paystack external HTTP API requests
    vi.spyOn(PaystackProvider.prototype, "createCheckout").mockImplementation(
      async () => ({
        checkoutUrl: `https://checkout.paystack.com/sandbox_mock_${Date.now()}`,
        providerReference: `mock_ref_${Date.now()}`,
        raw: { status: true },
      })
    );

    vi.spyOn(PaystackProvider.prototype, "cancelSubscription").mockImplementation(
      async () => true
    );

    // 2. Ensure Primary Billing Provider configuration exists
    await prisma.billingProviderConfig.upsert({
      where: { provider: BillingProvider.PAYSTACK },
      update: { enabled: true, priority: 1 },
      create: {
        provider: BillingProvider.PAYSTACK,
        enabled: true,
        priority: 1,
      },
    });

    // 3. Create sandbox test user matching User schema
    const user = await prisma.user.create({
      data: {
        fullName: "Sandbox Tester",
        username: testUsername,
        email: testEmail,
        password: "hashed_dummy_password",
      },
    });
    testUserId = user.id;
  }, 15000);

  afterAll(async () => {
    vi.restoreAllMocks();

    // Cleanup sandbox test data matching schema relations
    if (testUserId) {
      await prisma.billingWebhookEvent.deleteMany({
        where: {
          eventId: {
            contains: testUserId,
          },
        },
      });
      await prisma.payment.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.subscription.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
  }, 15000);

  it("1. Should return active plans including PRO tier", async () => {
    const plans = await getActivePlans();
    expect(plans.length).toBeGreaterThanOrEqual(4);
    const proPlan = plans.find((p) => p.code === "PRO");
    expect(proPlan).toBeDefined();
    expect(proPlan?.monthlyPrice).toBe(7900);
  }, 15000);

  it("2. Should report Free tier by default before any subscription", async () => {
    const overview = await getBillingOverview(testUserId);
    expect(overview.hasActiveSubscription).toBe(false);
    expect(overview.subscription).toBeNull();
    expect(overview.plan?.code).toBe("FREE");

    const entitlements = await getUserEntitlements(testUserId);
    expect(entitlements.plan.code).toBe("FREE");
    const features = entitlements.features as Record<string, boolean>;
    expect(features.aiAgent).toBe(false);
  }, 15000);

  it("3. Should initiate checkout for PRO monthly plan", async () => {
    const proPlan = await prisma.subscriptionPlan.findFirst({
      where: { code: "PRO", active: true },
    });
    expect(proPlan).toBeDefined();

    const checkout = await createCheckout(testUserId, proPlan!.id, "MONTHLY");
    expect(checkout.providerReference).toBeDefined();
    expect(checkout.checkoutUrl).toBeDefined();

    // Verify pending subscription created
    const pendingSub = await prisma.subscription.findFirst({
      where: {
        userId: testUserId,
        status: SubscriptionStatus.INCOMPLETE,
      },
    });
    expect(pendingSub).toBeDefined();
    expect(pendingSub?.interval).toBe(BillingInterval.MONTHLY);
  }, 15000);

  it("4. Should activate subscription via successful payment webhook", async () => {
    const pendingSub = await prisma.subscription.findFirst({
      where: {
        userId: testUserId,
        status: SubscriptionStatus.INCOMPLETE,
      },
      include: { plan: true },
    });
    expect(pendingSub).toBeDefined();

    const paymentReference = `pay_ref_${testUserId}_${Date.now()}`;
    const webhookEventId = `evt_${testUserId}_${Date.now()}`;

    const webhookResult = await processBillingWebhook({
      provider: BillingProvider.PAYSTACK,
      eventId: webhookEventId,
      eventType: "PAYMENT_SUCCESS",
      payload: {
        userId: testUserId,
        subscriptionId: pendingSub!.id,
        providerReference: paymentReference,
        amount: pendingSub!.plan.monthlyPrice,
        currency: "USD",
        interval: "MONTHLY",
        providerCustomerId: "cus_sandbox_123",
        providerSubscriptionId: "sub_sandbox_123",
      },
    });

    expect(webhookResult.success).toBe(true);

    // Verify overview reflects active PRO plan
    const overview = await getBillingOverview(testUserId);
    expect(overview.hasActiveSubscription).toBe(true);
    expect(overview.plan?.code).toBe("PRO");
    expect(overview.subscription?.status).toBe(SubscriptionStatus.ACTIVE);
    expect(overview.subscription?.currentPeriodEnd).toBeDefined();

    // Verify entitlements unlocked
    const entitlements = await getUserEntitlements(testUserId);
    expect(entitlements.plan.code).toBe("PRO");
    const features = entitlements.features as Record<string, boolean>;
    expect(features.aiAgent).toBe(true);
    expect(features.forecasting).toBe(true);
  }, 15000);

  it("5. Should handle idempotent duplicate webhook safely", async () => {
    const existingEvent = await prisma.billingWebhookEvent.findFirst({
      where: {
        eventId: {
          contains: testUserId,
        },
      },
    });
    expect(existingEvent).toBeDefined();

    const duplicateResult = await processBillingWebhook({
      provider: existingEvent!.provider,
      eventId: existingEvent!.eventId,
      eventType: existingEvent!.eventType,
      payload: existingEvent!.payload,
    });

    expect(duplicateResult.success).toBe(true);
    expect(duplicateResult.alreadyProcessed).toBe(true);
  }, 15000);

  it("6. Should allow cancelling active subscription gracefully", async () => {
    const cancelResult = await cancelUserSubscription(testUserId, {
      immediately: false,
    });
    expect(cancelResult.success).toBe(true);
    expect(cancelResult.subscription.cancelAtPeriodEnd).toBe(true);

    const overview = await getBillingOverview(testUserId);
    expect(overview.subscription?.cancelAtPeriodEnd).toBe(true);
    expect(overview.hasActiveSubscription).toBe(true);
  }, 15000);

  it("7. Should record transaction in billing history", async () => {
    const history = await getBillingHistory(testUserId);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].status).toBe("SUCCESS");
    expect(history[0].subscription?.plan.code).toBe("PRO");
  }, 15000);
});

