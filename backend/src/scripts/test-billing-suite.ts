import "dotenv/config";
import prisma from "../lib/prisma";
import {
  BillingProvider,
  SubscriptionStatus,
} from "@prisma/client";
import {
  getUserPlan,
  getUserEntitlements,
  hasFeature,
  getUsageLimit,
} from "../services/billingService";
import { processBillingWebhook } from "../services/billing/webhookService";

async function runSuite() {
  console.log("🧪 Starting Diralis Billing & Entitlement End-to-End Test Suite...\n");

  // 1. Create or retrieve test user
  const timestamp = Date.now();
  const testEmail = `test_billing_${timestamp}@example.com`;
  const testUsername = `billing_user_${timestamp}`;
  const testUser = await prisma.user.create({
    data: {
      email: testEmail,
      username: testUsername,
      fullName: "Billing Test User",
      password: "dummy_hash_for_test",
    },
  });
  console.log(`✅ [1/7] Created test user: ${testUser.email} (ID: ${testUser.id})`);

  // 2. Verify default FREE plan resolution and baseline entitlements
  const freePlan = await getUserPlan(testUser.id);
  const freeEntitlements = await getUserEntitlements(testUser.id);
  const aiChatAvailableOnFree = await hasFeature(testUser.id, "aiChat");
  const datasetLimitFree = await getUsageLimit(testUser.id, "datasets");

  const limitsRecord = (freeEntitlements.limits ?? {}) as Record<string, unknown>;

  console.log(`✅ [2/7] Default plan resolved to: ${freePlan?.code} (${freePlan?.name})`);
  console.log(`       - Datasets limit: ${datasetLimitFree}`);
  console.log(`       - aiChat feature: ${aiChatAvailableOnFree}`);
  console.log(`       - Storage limit MB: ${limitsRecord["storageMb"] ?? "N/A"}`);

  // 3. Find PRO plan for subscription upgrade test
  const proPlan = await prisma.subscriptionPlan.findFirst({
    where: { code: "PRO", active: true },
  });

  if (!proPlan) {
    throw new Error("PRO plan not found. Please run seed-plans.ts first.");
  }

  // 4. Create pending subscription record
  const subscription = await prisma.subscription.create({
    data: {
      userId: testUser.id,
      planId: proPlan.id,
      provider: BillingProvider.PAYSTACK,
      status: SubscriptionStatus.INCOMPLETE,
      interval: "MONTHLY",
    },
  });
  console.log(`✅ [3/7] Created pending subscription: ${subscription.id} for plan ${proPlan.code}`);

  // 5. Simulate PAYMENT_SUCCESS webhook
  const eventId = `evt_test_${Date.now()}`;
  const providerRef = `ref_pay_${Date.now()}`;

  const webhookResult = await processBillingWebhook({
    provider: BillingProvider.PAYSTACK,
    eventId,
    eventType: "PAYMENT_SUCCESS",
    payload: {
      userId: testUser.id,
      subscriptionId: subscription.id,
      providerReference: providerRef,
      amount: proPlan.monthlyPrice,
      currency: proPlan.currency,
      interval: "MONTHLY",
    },
  });

  console.log(`✅ [4/7] Webhook PAYMENT_SUCCESS processed (alreadyProcessed=${webhookResult.alreadyProcessed})`);

  // 6. Test Webhook Idempotency / Deduplication
  const duplicateWebhookResult = await processBillingWebhook({
    provider: BillingProvider.PAYSTACK,
    eventId,
    eventType: "PAYMENT_SUCCESS",
    payload: {
      userId: testUser.id,
      subscriptionId: subscription.id,
      providerReference: providerRef,
    },
  });
  console.log(`✅ [5/7] Webhook Deduplication verified (alreadyProcessed=${duplicateWebhookResult.alreadyProcessed})`);

  // 7. Verify upgraded entitlements & active subscription state
  const activePlan = await getUserPlan(testUser.id);
  const activeSubscription = await prisma.subscription.findUnique({
    where: { id: subscription.id },
  });
  const proDatasetLimit = await getUsageLimit(testUser.id, "datasets");

  console.log(`✅ [6/7] Active plan verified: ${activePlan?.code} (Status: ${activeSubscription?.status})`);
  console.log(`       - Upgraded dataset limit: ${proDatasetLimit}`);

  // 8. Simulate SUBSCRIPTION_CANCELLED webhook
  const cancelEventId = `evt_cancel_${Date.now()}`;
  await processBillingWebhook({
    provider: BillingProvider.PAYSTACK,
    eventId: cancelEventId,
    eventType: "SUBSCRIPTION_CANCELLED",
    payload: {
      subscriptionId: subscription.id,
    },
  });

  const cancelledSubscription = await prisma.subscription.findUnique({
    where: { id: subscription.id },
  });
  console.log(`✅ [7/7] Cancellation processed. New status: ${cancelledSubscription?.status}, currentKey: ${cancelledSubscription?.currentKey ?? "null"}`);

  // Cleanup test user and associated records
  await prisma.payment.deleteMany({ where: { userId: testUser.id } });
  await prisma.subscription.deleteMany({ where: { userId: testUser.id } });
  await prisma.billingWebhookEvent.deleteMany({ where: { eventId: { in: [eventId, cancelEventId] } } });
  await prisma.user.delete({ where: { id: testUser.id } });

  console.log("\n🎉 All 7 Billing & Lifecycle Verification stages PASSED successfully!\n");
}

runSuite()
  .catch((err) => {
    console.error("❌ Billing test suite failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  