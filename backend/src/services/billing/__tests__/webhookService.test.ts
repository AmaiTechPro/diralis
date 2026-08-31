import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { BillingProvider, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { processBillingWebhook } from "../webhookService";
import prisma from "../../../lib/prisma";

// Mock email service to prevent network side-effects during tests
vi.mock("../../emailService", () => ({
  sendPaymentSuccessEmail: vi.fn().mockResolvedValue(undefined),
  sendSubscriptionActivatedEmail: vi.fn().mockResolvedValue(undefined),
  sendSubscriptionCancelledEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("Billing Webhook Service Integration Tests", () => {
  let testUserId: string;
  let testPlanId: string;

  beforeAll(async () => {
    // 1. Ensure active plan fixture
    let plan = await prisma.subscriptionPlan.findFirst({ where: { active: true } });
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          code: "TEST_PRO",
          name: "Test Pro",
          monthlyPrice: 2900,
          currency: "USD",
          active: true,
          limits: {},
          features: {},
        },
      });
    }
    testPlanId = plan.id;

    // 2. Ensure persisted user fixture
    const user = await prisma.user.upsert({
      where: { email: "webhook-suite@diralis.com" },
      update: {},
      create: {
        email: "webhook-suite@diralis.com",
        username: "webhooksuite",
        password: "mocked_password",
        fullName: "Webhook Suite Tester",
      },
    });
    testUserId = user.id;
  }, 15000);

  beforeEach(async () => {
    // Clean up previous test run artifacts
    await prisma.billingWebhookEvent.deleteMany({
      where: {
        eventId: {
          in: ["evt_test_charge_success", "evt_test_duplicate", "evt_test_sub_cancel"],
        },
      },
    });
    await prisma.payment.deleteMany({
      where: {
        providerReference: {
          in: ["ref_test_success_1", "ref_test_dup"],
        },
      },
    });
    await prisma.subscription.deleteMany({
      where: { userId: testUserId },
    });
  });

  afterAll(async () => {
    await prisma.billingWebhookEvent.deleteMany({
      where: {
        eventId: {
          in: ["evt_test_charge_success", "evt_test_duplicate", "evt_test_sub_cancel"],
        },
      },
    });
    await prisma.payment.deleteMany({
      where: {
        providerReference: {
          in: ["ref_test_success_1", "ref_test_dup"],
        },
      },
    });
    await prisma.subscription.deleteMany({
      where: { userId: testUserId },
    });
  }, 15000);

  it(
    "should process charge.success and activate subscription atomically",
    async () => {
      const sub = await prisma.subscription.create({
        data: {
          userId: testUserId,
          planId: testPlanId,
          status: SubscriptionStatus.INCOMPLETE,
          interval: "MONTHLY",
          provider: BillingProvider.PAYSTACK,
        },
      });

      // 1. Process webhook event
      const result = await processBillingWebhook({
        provider: BillingProvider.PAYSTACK,
        eventId: "evt_test_charge_success",
        eventType: "CHARGE_SUCCESS",
        payload: {
          userId: testUserId,
          subscriptionId: sub.id,
          providerReference: "ref_test_success_1",
          amount: 2900,
          currency: "USD",
          interval: "MONTHLY",
        },
      });

      expect(result.success).toBe(true);
      expect(result.alreadyProcessed).toBe(false);

      // 2. Verify Payment Record in Database
      const payment = await prisma.payment.findUnique({
        where: { providerReference: "ref_test_success_1" },
      });
      expect(payment).toBeDefined();
      expect(payment?.status).toBe(PaymentStatus.SUCCESS);
      expect(payment?.amount).toBe(2900);

      // 3. Verify Subscription Transitioned to ACTIVE
      const updatedSub = await prisma.subscription.findUnique({
        where: { id: sub.id },
      });
      expect(updatedSub?.status).toBe(SubscriptionStatus.ACTIVE);
      expect(updatedSub?.currentPeriodStart).not.toBeNull();
      expect(updatedSub?.currentPeriodEnd).not.toBeNull();
    },
    15000
  );

  it(
    "should maintain idempotency on duplicate webhook deliveries",
    async () => {
      const payload = {
        userId: testUserId,
        providerReference: "ref_test_dup",
        amount: 1000,
        currency: "USD",
      };

      // First delivery
      const res1 = await processBillingWebhook({
        provider: BillingProvider.PAYSTACK,
        eventId: "evt_test_duplicate",
        eventType: "CHARGE_SUCCESS",
        payload,
      });
      expect(res1.success).toBe(true);
      expect(res1.alreadyProcessed).toBe(false);

      // Second delivery (duplicate)
      const res2 = await processBillingWebhook({
        provider: BillingProvider.PAYSTACK,
        eventId: "evt_test_duplicate",
        eventType: "CHARGE_SUCCESS",
        payload,
      });
      expect(res2.success).toBe(true);
      expect(res2.alreadyProcessed).toBe(true);
    },
    15000
  );

  it(
    "should handle SUBSCRIPTION_CANCELLED event and set status to CANCELLED",
    async () => {
      const sub = await prisma.subscription.create({
        data: {
          userId: testUserId,
          planId: testPlanId,
          status: SubscriptionStatus.ACTIVE,
          interval: "MONTHLY",
          provider: BillingProvider.PAYSTACK,
          currentKey: `${testUserId}_current`,
        },
      });

      const result = await processBillingWebhook({
        provider: BillingProvider.PAYSTACK,
        eventId: "evt_test_sub_cancel",
        eventType: "SUBSCRIPTION_CANCELLED",
        payload: {
          subscriptionId: sub.id,
        },
      });

      expect(result.success).toBe(true);

      const updatedSub = await prisma.subscription.findUnique({
        where: { id: sub.id },
      });
      expect(updatedSub?.status).toBe(SubscriptionStatus.CANCELLED);
      expect(updatedSub?.currentKey).toBeNull();
      expect(updatedSub?.cancelledAt).not.toBeNull();
    },
    15000
  );
});


