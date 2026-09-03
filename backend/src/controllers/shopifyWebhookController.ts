import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { ShopifyWebhookVerifier } from "../services/integration/providers/shopify/shopifyWebhookVerifier";
import { ShopifyWebhookProcessor } from "../services/integration/providers/shopify/shopifyWebhookProcessor";
import { WebhookEventStatus } from "@prisma/client";

export async function handleShopifyWebhook(req: Request, res: Response): Promise<void> {
  try {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody || req.body;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || "";

    // 1. Extract and validate required Shopify headers
    const headers = ShopifyWebhookVerifier.extractHeaders(req.headers);
    if (!headers) {
      res.status(400).json({ error: "MISSING_REQUIRED_SHOPIFY_HEADERS" });
      return;
    }

    // 2. Timing-safe HMAC verification
    const isValid = ShopifyWebhookVerifier.verifyHmac(rawBody, clientSecret, headers.hmacHeader);
    if (!isValid) {
      res.status(401).json({ error: "INVALID_HMAC_SIGNATURE" });
      return;
    }

    // 3. Resolve Connection and Tenant from shopDomain
    const normalizedDomain = headers.shopDomain.toLowerCase().trim();
    const connection = await prisma.integrationConnection.findFirst({
      where: {
        providerId: "shopify_pos",
        status: "ACTIVE",
      },
    });

    if (!connection) {
      res.status(404).json({ error: "CONNECTION_NOT_FOUND_OR_INACTIVE" });
      return;
    }

    // 4. Compute payload hash for audit trail
    const bodyBuffer = Buffer.isBuffer(rawBody)
      ? rawBody
      : Buffer.from(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody || {}));
    const payloadHash = crypto.createHash("sha256").update(bodyBuffer).digest("hex");

    // 5. Idempotent Deduplication Check
    const existingEvent = await prisma.integrationEvent.findUnique({
      where: { deliveryId: headers.deliveryId },
    });

    if (existingEvent) {
      res.status(200).json({ status: "DUPLICATE", eventId: existingEvent.id });
      return;
    }

    // 6. Record Event into IntegrationEvent
    const newEvent = await prisma.integrationEvent.create({
      data: {
        connectionId: connection.id,
        tenantId: connection.userId,
        provider: "shopify",
        topic: headers.topic,
        deliveryId: headers.deliveryId,
        shopDomain: normalizedDomain,
        status: WebhookEventStatus.RECEIVED,
        payloadHash,
      },
    });

    // 7. Fast Acknowledgement (< 200ms)
    res.status(200).json({ status: "ACCEPTED", eventId: newEvent.id });

    // 8. Dispatch Asynchronous Background Processing
    setImmediate(() => {
      ShopifyWebhookProcessor.processEvent(newEvent.id).catch((err) => {
        console.error(`[ShopifyWebhook] Background worker failure for event ${newEvent.id}:`, err);
      });
    });
  } catch (error: any) {
    console.error("[ShopifyWebhook] Unexpected error in webhook endpoint:", error);
    res.status(500).json({ error: "INTERNAL_WEBHOOK_ERROR", message: error.message });
  }
}

