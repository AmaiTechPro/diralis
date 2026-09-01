import { Request, Response } from "express";
import { BillingProvider } from "@prisma/client";
import { getPaymentProvider } from "../services/billing/providers/providerFactory";
import {
  getActivePlans,
  getCurrentSubscription,
  getUserEntitlements,
  getBillingOverview,
} from "../services/billingService";
import { createCheckout } from "../services/billing/checkoutService";
import { processBillingWebhook } from "../services/billing/webhookService";
import {
  getBillingHistory,
  getPaymentReceipt,
} from "../services/billing/historyService";
import { verifyBillingPayment } from "../services/billing/verificationService";
import { cancelUserSubscription } from "../services/billing/cancelSubscriptionService";

// =========================
// Get Available Plans
// =========================

export async function getPlans(req: Request, res: Response) {
  try {
    const plans = await getActivePlans();

    res.json({
      plans,
    });
  } catch (error) {
    console.error("Failed to load billing plans:", error);

    res.status(500).json({
      message: "Failed to load billing plans",
    });
  }
}

// =========================
// Get Billing Overview (Unified State)
// =========================

export async function getBillingOverviewController(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const overview = await getBillingOverview(userId);

    return res.json(overview);
  } catch (error) {
    console.error("Failed to load billing overview:", error);

    return res.status(500).json({
      message: "Failed to load billing overview",
    });
  }
}

// =========================
// Get Current Subscription
// =========================

export async function getSubscription(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const subscription = await getCurrentSubscription(userId);

    res.json({
      subscription,
    });
  } catch (error) {
    console.error("Failed to load subscription:", error);

    res.status(500).json({
      message: "Failed to load subscription",
    });
  }
}

// =========================
// Get User Entitlements
// =========================

export async function getEntitlements(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const entitlements = await getUserEntitlements(userId);

    res.json(entitlements);
  } catch (error) {
    console.error("Failed to load entitlements:", error);

    res.status(500).json({
      message: "Failed to load entitlements",
    });
  }
}

// =========================
// Create Checkout
// =========================

export async function checkout(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { planId, interval } = req.body;

    if (!planId) {
      return res.status(400).json({
        message: "planId is required",
      });
    }

    if (interval !== "MONTHLY" && interval !== "YEARLY") {
      return res.status(400).json({
        message: "Invalid billing interval",
      });
    }

    const result = await createCheckout(userId, planId, interval);

    res.json(result);
  } catch (error) {
    console.error("Failed to create checkout:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "USER_NOT_FOUND":
          return res.status(404).json({
            message: "User not found",
          });

        case "PLAN_NOT_AVAILABLE":
          return res.status(400).json({
            message: "Plan is not available",
          });

        case "CUSTOM_PLAN_REQUIRES_CONTACT":
          return res.status(400).json({
            message: "Custom plans require contacting Diralis.",
          });

        case "PLAN_PRICE_NOT_CONFIGURED":
          return res.status(400).json({
            message: "This plan does not have pricing configured yet.",
          });

        case "FREE_PLAN_DOES_NOT_REQUIRE_CHECKOUT":
          return res.status(400).json({
            message: "The FREE plan does not require checkout.",
          });

        case "ALREADY_SUBSCRIBED_TO_PLAN":
          return res.status(400).json({
            message:
              "You are already actively subscribed to this plan and interval.",
          });
      }
    }

    res.status(500).json({
      message: "Failed to create checkout",
    });
  }
}

// =========================
// Verify Billing Payment
// =========================

export async function verifyBillingPaymentController(
  req: Request,
  res: Response
) {
  try {
    const reference =
      typeof req.query.reference === "string" ? req.query.reference : "";

    if (!reference) {
      return res.status(400).json({
        message: "Payment reference is required",
      });
    }

    const result = await verifyBillingPayment(reference);

    return res.json(result);
  } catch (error) {
    console.error("Failed to verify billing payment:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "PAYMENT_REFERENCE_REQUIRED":
          return res.status(400).json({
            message: "Payment reference is required",
          });

        case "PAYMENT_NOT_FOUND":
          return res.status(404).json({
            message: "Payment transaction was not found",
          });

        case "PAYMENT_NOT_SUCCESSFUL":
          return res.status(400).json({
            message: "Payment has not been completed successfully",
          });

        case "PAYMENT_REFERENCE_MISMATCH":
          return res.status(400).json({
            message: "Payment reference verification failed",
          });

        case "PAYMENT_AMOUNT_MISMATCH":
          return res.status(400).json({
            message: "Payment amount verification failed",
          });

        case "PAYMENT_CURRENCY_MISMATCH":
          return res.status(400).json({
            message: "Payment currency verification failed",
          });
      }
    }

    return res.status(500).json({
      message: "Failed to verify payment",
    });
  }
}

// =========================
// Cancel Subscription
// =========================

export async function cancelSubscriptionController(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const immediately = req.body?.immediately === true;

    const result = await cancelUserSubscription(userId, { immediately });

    return res.json(result);
  } catch (error) {
    console.error("Failed to cancel subscription:", error);

    if (error instanceof Error) {
      if (error.message === "NO_ACTIVE_SUBSCRIPTION_FOUND") {
        return res.status(404).json({
          message: "No active subscription found to cancel",
        });
      }
    }

    return res.status(500).json({
      message: "Failed to cancel subscription",
    });
  }
}

// =========================
// Billing Webhook
// =========================

export async function billingWebhook(req: Request, res: Response) {
  try {
    // 1. Detect provider from header or identify Paystack signature
    const headerProvider = req.headers["x-billing-provider"];
    const paystackSignature = req.headers["x-paystack-signature"];

    let providerType: BillingProvider = BillingProvider.PAYSTACK;

    if (typeof headerProvider === "string" && headerProvider.toUpperCase() in BillingProvider) {
      providerType = headerProvider.toUpperCase() as BillingProvider;
    } else if (paystackSignature) {
      providerType = BillingProvider.PAYSTACK;
    }

    const provider = getPaymentProvider(providerType);

    // 2. Extract signature
    const signature =
      (typeof paystackSignature === "string" ? paystackSignature : null) ||
      (typeof req.headers["x-webhook-signature"] === "string"
        ? req.headers["x-webhook-signature"]
        : "");

    if (!signature) {
      console.warn("⚠️ Webhook missing signature header");
      return res.status(401).json({
        message: "Missing webhook signature",
      });
    }

    // 3. Extract raw body with JSON string fallback
    const rawReq = req as Request & { rawBody?: Buffer | string };
    const rawBody = rawReq.rawBody
      ? typeof rawReq.rawBody === "string"
        ? rawReq.rawBody
        : rawReq.rawBody.toString("utf8")
      : JSON.stringify(req.body);

    if (!rawBody) {
      console.warn("⚠️ Webhook raw body missing");
      return res.status(400).json({
        message: "Raw webhook body is required",
      });
    }

    const isValid = provider.verifyWebhook(signature, rawBody);

    if (!isValid) {
      console.warn("⚠️ Webhook signature validation failed");
      return res.status(401).json({
        message: "Invalid webhook signature",
      });
    }

    // 4. Normalize & process webhook event
    const normalized = provider.normalizeWebhook(req.body);

    const result = await processBillingWebhook({
      provider: provider.name,
      eventId: normalized.eventId,
      eventType: normalized.eventType,
      payload: normalized,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Billing webhook failed:", error);

    return res.status(500).json({
      message: "Billing webhook processing failed",
    });
  }
}
// =========================
// Billing History
// =========================

export async function billingHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const history = await getBillingHistory(userId);

    return res.json({
      history,
    });
  } catch (error) {
    console.error("Failed to load billing history:", error);

    return res.status(500).json({
      message: "Failed to load billing history",
    });
  }
}

// =========================
// Payment Receipt
// =========================

export async function getReceiptController(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const rawPaymentId = req.params.paymentId;
    const paymentId = Array.isArray(rawPaymentId)
      ? rawPaymentId[0]
      : rawPaymentId;

    if (!paymentId || typeof paymentId !== "string") {
      return res.status(400).json({
        message: "Payment ID is required",
      });
    }

    const receipt = await getPaymentReceipt(userId, paymentId);

    return res.json({
      receipt,
    });
  } catch (error) {
    console.error("Failed to load receipt:", error);

    if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
      return res.status(404).json({
        message: "Payment receipt not found",
      });
    }

    return res.status(500).json({
      message: "Failed to load receipt",
    });
  }
}

