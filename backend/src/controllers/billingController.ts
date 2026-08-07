import { Request, Response } from "express";

import { BillingProvider } from "@prisma/client";

import crypto from "crypto";

import { getPaymentProvider }
from "../services/billing/providers/providerFactory";


import {
  getActivePlans,
  getCurrentSubscription,
  getUserEntitlements,
} from "../services/billingService";

import { createCheckout } from "../services/billing/checkoutService";

import { processBillingWebhook } from "../services/billing/webhookService";

import {
getBillingHistory,
} from "../services/billing/historyService";

import {
  verifyBillingPayment,
} from "../services/billing/verificationService";





// =========================
// Get Available Plans
// =========================

export async function getPlans(
  req: Request,
  res: Response
) {
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
// Get Current Subscription
// =========================

export async function getSubscription(
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

    const subscription =
      await getCurrentSubscription(userId);

    res.json({
      subscription,
    });
  } catch (error) {
    console.error(
      "Failed to load subscription:",
      error
    );

    res.status(500).json({
      message: "Failed to load subscription",
    });
  }
}

// =========================
// Get User Entitlements
// =========================

export async function getEntitlements(
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

    const entitlements =
      await getUserEntitlements(userId);

    res.json(entitlements);
  } catch (error) {
    console.error(
      "Failed to load entitlements:",
      error
    );

    res.status(500).json({
      message: "Failed to load entitlements",
    });
  }
}


// =========================
// Create Checkout
// =========================

export async function checkout(
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

    const { planId, interval } = req.body;

    if (!planId) {
      return res.status(400).json({
        message: "planId is required",
      });
    }

    if (
      interval !== "MONTHLY" &&
      interval !== "YEARLY"
    ) {
      return res.status(400).json({
        message: "Invalid billing interval",
      });
    }

    const result = await createCheckout(
      userId,
      planId,
      interval
    );

    res.json(result);
  } catch (error) {
    console.error(
      "Failed to create checkout:",
      error
    );

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
            message:
              "Custom plans require contacting Diralis.",
          });

        case "PLAN_PRICE_NOT_CONFIGURED":
          return res.status(400).json({
            message:
              "This plan does not have pricing configured yet.",
          });

        case "FREE_PLAN_DOES_NOT_REQUIRE_CHECKOUT":
          return res.status(400).json({
            message:
              "The FREE plan does not require checkout.",
          });
      }
    }

    res.status(500).json({
      message: "Failed to create checkout",
    });
  }
}


 //Verification //

 // =========================
// Verify Billing Payment
// =========================

export async function verifyBillingPaymentController(
  req: Request,
  res: Response
) {
  try {
    const reference =
      typeof req.query.reference === "string"
        ? req.query.reference
        : "";

    if (!reference) {
      return res.status(400).json({
        message: "Payment reference is required",
      });
    }

    const result =
      await verifyBillingPayment(reference);

    return res.json(result);
  } catch (error) {
    console.error(
      "Failed to verify billing payment:",
      error
    );

    if (error instanceof Error) {
      switch (error.message) {
        case "PAYMENT_REFERENCE_REQUIRED":
          return res.status(400).json({
            message:
              "Payment reference is required",
          });

        case "PAYMENT_NOT_FOUND":
          return res.status(404).json({
            message:
              "Payment transaction was not found",
          });

        case "PAYMENT_NOT_SUCCESSFUL":
          return res.status(400).json({
            message:
              "Payment has not been completed successfully",
          });

        case "PAYMENT_REFERENCE_MISMATCH":
          return res.status(400).json({
            message:
              "Payment reference verification failed",
          });

        case "PAYMENT_AMOUNT_MISMATCH":
          return res.status(400).json({
            message:
              "Payment amount verification failed",
          });

        case "PAYMENT_CURRENCY_MISMATCH":
          return res.status(400).json({
            message:
              "Payment currency verification failed",
          });
      }
    }

    return res.status(500).json({
      message:
        "Failed to verify payment",
    });
  }
}



// =========================
// Billing Webhook
// =========================

export async function billingWebhook(
  req: Request,
  res: Response
) {
  try {
    const providerName =
      req.headers["x-billing-provider"];

    if (!providerName || typeof providerName !== "string") {
      return res.status(400).json({
        message: "Missing billing provider header",
      });
    }


    const provider =
      getPaymentProvider(
        providerName as BillingProvider
      );


    const signature =
      req.headers["x-paystack-signature"];


    if (
      !signature ||
      typeof signature !== "string"
    ) {
      return res.status(401).json({
        message: "Missing webhook signature",
      });
    }


    const rawBody =
      (req as Request & {
        rawBody?: Buffer;
      }).rawBody;


    if (!rawBody) {
      return res.status(400).json({
        message:
          "Raw webhook body is required",
      });
    }


    const valid =
      provider.verifyWebhook(
        signature,
        rawBody.toString()
      );


    if (!valid) {
      return res.status(401).json({
        message:
          "Invalid webhook signature",
      });
    }


    const normalized =
      provider.normalizeWebhook(
        req.body
      );


    const result =
      await processBillingWebhook({
        provider:
          provider.name,

        eventId:
          normalized.eventId,

        eventType:
          normalized.eventType,

        payload:
          normalized,
      });


    return res.status(200).json(result);


  } catch (error) {

    console.error(
      "Billing webhook failed:",
      error
    );


    return res.status(500).json({
      message:
        "Billing webhook processing failed",
    });
  }
}


export async function billingHistory(
req: Request,
res: Response
) {

try {

const userId =
req.user?.userId;


if (!userId) {

return res.status(401).json({
message:
"Unauthorized",
});

}


const history =
await getBillingHistory(userId);


return res.json({
history,
});


}
catch(error){

console.error(
"Failed to load billing history:",
error
);


return res.status(500).json({

message:
"Failed to load billing history",

});

}

}









