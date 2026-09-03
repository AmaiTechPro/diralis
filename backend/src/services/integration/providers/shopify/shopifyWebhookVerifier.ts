import crypto from "crypto";

export interface ShopifyWebhookHeaders {
  topic: string;
  hmacHeader: string;
  shopDomain: string;
  deliveryId: string;
  apiVersion?: string;
}

export class ShopifyWebhookVerifier {
  /**
   * Extracts and normalizes required Shopify webhook headers.
   */
  public static extractHeaders(
    headers: Record<string, string | string[] | undefined>
  ): ShopifyWebhookHeaders | null {
    const getHeader = (key: string): string | undefined => {
      const val = headers[key] || headers[key.toLowerCase()];
      if (Array.isArray(val)) return val[0];
      return val;
    };

    const topic = getHeader("x-shopify-topic");
    const hmacHeader = getHeader("x-shopify-hmac-sha256");
    const shopDomain = getHeader("x-shopify-shop-domain");
    const deliveryId = getHeader("x-shopify-webhook-id");
    const apiVersion = getHeader("x-shopify-api-version");

    if (!topic || !hmacHeader || !shopDomain || !deliveryId) {
      return null;
    }

    return {
      topic: topic.trim(),
      hmacHeader: hmacHeader.trim(),
      shopDomain: shopDomain.trim().toLowerCase(),
      deliveryId: deliveryId.trim(),
      apiVersion: apiVersion?.trim(),
    };
  }

  /**
   * Verifies the Shopify HMAC signature using timing-safe buffer comparison.
   * Defensively handles Buffer, string, or parsed JSON payload types.
   */
  public static verifyHmac(
    rawBody: Buffer | string | Record<string, any> | undefined,
    secret: string,
    expectedHmac: string
  ): boolean {
    if (!rawBody || !secret || !expectedHmac) {
      return false;
    }

    try {
      let bodyBuffer: Buffer;
      if (Buffer.isBuffer(rawBody)) {
        bodyBuffer = rawBody;
      } else if (typeof rawBody === "string") {
        bodyBuffer = Buffer.from(rawBody, "utf8");
      } else {
        bodyBuffer = Buffer.from(JSON.stringify(rawBody), "utf8");
      }

      const generatedHmac = crypto
        .createHmac("sha256", secret)
        .update(bodyBuffer)
        .digest("base64");

      const generatedBuffer = Buffer.from(generatedHmac, "utf8");
      const expectedBuffer = Buffer.from(expectedHmac, "utf8");

      if (generatedBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(generatedBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }
}

