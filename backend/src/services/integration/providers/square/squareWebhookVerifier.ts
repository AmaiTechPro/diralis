import crypto from "crypto";

export class SquareWebhookVerifier {
  /**
   * Verifies Square webhook signature using HMAC-SHA256.
   * Square computes: Base64(HMAC-SHA256(signatureKey, notificationUrl + rawBody))
   */
  public static verifySignature(params: {
    rawBody: string | Buffer;
    signatureHeader: string;
    signatureKey: string;
    notificationUrl: string;
  }): boolean {
    const { rawBody, signatureHeader, signatureKey, notificationUrl } = params;

    if (!signatureHeader || !signatureKey) {
      return false;
    }

    try {
      const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf-8") : rawBody;
      const payload = notificationUrl + bodyString;

      const hmac = crypto.createHmac("sha256", signatureKey);
      hmac.update(payload);
      const computedSignature = hmac.digest("base64");

      const signatureBuffer = Buffer.from(signatureHeader, "base64");
      const computedBuffer = Buffer.from(computedSignature, "base64");

      if (signatureBuffer.length !== computedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
    } catch {
      return false;
    }
  }
}



