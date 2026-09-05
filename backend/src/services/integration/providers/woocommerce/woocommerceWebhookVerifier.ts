import crypto from "crypto";

export class WooCommerceWebhookVerifier {
  /**
   * Verifies incoming WooCommerce webhook HMAC-SHA256 signature.
   * Header: x-wc-webhook-signature (Base64-encoded HMAC)
   */
  public static verifySignature(
    rawBody: string | Buffer,
    signatureHeader: string | undefined,
    secret: string
  ): boolean {
    if (!signatureHeader || !secret) {
      return false;
    }

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody);
    const calculated = hmac.digest("base64");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signatureHeader, "utf8"),
        Buffer.from(calculated, "utf8")
      );
    } catch {
      return false;
    }
  }
}


