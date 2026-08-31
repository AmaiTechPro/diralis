{/* 


import { Router } from "express";

import { authenticate } from "../middleware/authMiddleware";

import {
  getPlans,
  getSubscription,
  getEntitlements,
  checkout,
  billingWebhook,
  billingHistory,
  verifyBillingPaymentController,
} from "../controllers/billingController";

const router = Router();

// Public — pricing page
router.get(
  "/plans",
  getPlans
);

// Protected billing information
router.get(
  "/subscription",
  authenticate,
  getSubscription
);

router.get(
  "/entitlements",
  authenticate,
  getEntitlements
);

router.post(
  "/checkout",
  authenticate,
  checkout
);

router.post(
  "/webhook",
  billingWebhook
);

router.get(
"/history",
authenticate,
billingHistory
);


router.get(
  "/verify",
  verifyBillingPaymentController
);



export default router;

 */}


              {/* NEW ROUTES */}

import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  getPlans,
  getSubscription,
  getEntitlements,
  getBillingOverviewController,
  checkout,
  cancelSubscriptionController,
  billingWebhook,
  billingHistory,
  getReceiptController,
  verifyBillingPaymentController,
} from "../controllers/billingController";

const router = Router();

// Public — pricing page
router.get("/plans", getPlans);

// Protected billing information & status
router.get("/overview", authenticate, getBillingOverviewController);
router.get("/subscription", authenticate, getSubscription);
router.get("/entitlements", authenticate, getEntitlements);

// Checkout & verification
router.post("/checkout", authenticate, checkout);
router.get("/verify", verifyBillingPaymentController);

// Cancellation
router.post("/cancel", authenticate, cancelSubscriptionController);

// Invoicing & transaction history
router.get("/history", authenticate, billingHistory);
router.get("/receipt/:paymentId", authenticate, getReceiptController);

// Webhook handling
router.post("/webhook", billingWebhook);

export default router;