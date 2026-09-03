import crypto from "crypto";
import request from "supertest";
import app from "../../app";
import prisma from "../../lib/prisma";
import { ShopifyWebhookVerifier } from "../../services/integration/providers/shopify/shopifyWebhookVerifier";
import { ShopifyWebhookProcessor } from "../../services/integration/providers/shopify/shopifyWebhookProcessor";

describe("Shopify Real-Time Webhook Pipeline", () => {
  const secret = "test_shopify_secret_1234567890123456";
  const originalEnvSecret = process.env.SHOPIFY_CLIENT_SECRET;

  beforeAll(() => {
    process.env.SHOPIFY_CLIENT_SECRET = secret;
  });

  afterAll(() => {
    process.env.SHOPIFY_CLIENT_SECRET = originalEnvSecret;
  });

  describe("ShopifyWebhookVerifier (HMAC & Headers)", () => {
    it("verifies a valid HMAC signature using timing-safe buffer comparison", () => {
      const payload = JSON.stringify({ id: 1001, test: true });
      const expectedHmac = crypto
        .createHmac("sha256", secret)
        .update(Buffer.from(payload, "utf8"))
        .digest("base64");

      const isValid = ShopifyWebhookVerifier.verifyHmac(payload, secret, expectedHmac);
      expect(isValid).toBe(true);
    });

    it("rejects an invalid HMAC signature", () => {
      const payload = JSON.stringify({ id: 1001, test: true });
      const invalidHmac = Buffer.from("invalid_signature_hash").toString("base64");

      const isValid = ShopifyWebhookVerifier.verifyHmac(payload, secret, invalidHmac);
      expect(isValid).toBe(false);
    });

    it("rejects a payload modified after signing", () => {
      const originalPayload = JSON.stringify({ id: 1001, amount: 50.0 });
      const validHmac = crypto
        .createHmac("sha256", secret)
        .update(Buffer.from(originalPayload, "utf8"))
        .digest("base64");

      const tamperedPayload = JSON.stringify({ id: 1001, amount: 500.0 });
      const isValid = ShopifyWebhookVerifier.verifyHmac(tamperedPayload, secret, validHmac);
      expect(isValid).toBe(false);
    });

    it("extracts and validates required webhook headers safely", () => {
      const headers = {
        "x-shopify-topic": "orders/create",
        "x-shopify-hmac-sha256": "dummy_hmac==",
        "x-shopify-shop-domain": "test-store.myshopify.com",
        "x-shopify-webhook-id": "deliv-uuid-001",
      };

      const extracted = ShopifyWebhookVerifier.extractHeaders(headers);
      expect(extracted).toEqual({
        topic: "orders/create",
        hmacHeader: "dummy_hmac==",
        shopDomain: "test-store.myshopify.com",
        deliveryId: "deliv-uuid-001",
        apiVersion: undefined,
      });
    });

    it("returns null when required headers are missing", () => {
      const incompleteHeaders = {
        "x-shopify-topic": "orders/create",
      };
      expect(ShopifyWebhookVerifier.extractHeaders(incompleteHeaders)).toBeNull();
    });
  });

  describe("HTTP Webhook Endpoint (`POST /api/integrations/shopify/webhooks`)", () => {
    let testUserId: string;
    let testConnectionId: string;
    const testDeliveryId = "delivery-test-" + Date.now();

    beforeAll(async () => {
      // Create test user and connection
      const user = await prisma.user.create({
        data: {
          email: `shopify-webhook-${Date.now()}@diralis.test`,
          username: `shop-test-${Date.now()}`,
          fullName: "Shopify Webhook Test User",
        },
      });
      testUserId = user.id;

      const connection = await prisma.integrationConnection.create({
        data: {
          userId: testUserId,
          providerId: "shopify_pos",
          name: "Test Shopify Store",
          status: "ACTIVE",
          encryptedConfig: "dummy_config",
        },
      });
      testConnectionId = connection.id;
    });

    afterAll(async () => {
      // Clean up test records
      await prisma.integrationEvent.deleteMany({
        where: { connectionId: testConnectionId },
      });
      await prisma.integrationConnection.deleteMany({
        where: { id: testConnectionId },
      });
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
    });

    it("rejects requests missing required Shopify headers with 400", async () => {
      const res = await request(app)
        .post("/api/integrations/shopify/webhooks")
        .send({ test: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("MISSING_REQUIRED_SHOPIFY_HEADERS");
    });

    it("rejects unauthorized webhook requests with invalid HMAC with 401", async () => {
      const payload = JSON.stringify({ id: 9999, note: "Tampered" });
      const res = await request(app)
        .post("/api/integrations/shopify/webhooks")
        .set("x-shopify-topic", "orders/create")
        .set("x-shopify-hmac-sha256", "invalid_hmac_hash_that_does_not_match")
        .set("x-shopify-shop-domain", "test-store.myshopify.com")
        .set("x-shopify-webhook-id", "test-delivery-bad-hmac")
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("INVALID_HMAC_SIGNATURE");
    });

    it("accepts valid webhook deliveries and responds fast (<200ms) with ACCEPTED", async () => {
      const processSpy = jest.spyOn(ShopifyWebhookProcessor, "processEvent").mockResolvedValue(undefined);

      const payload = JSON.stringify({
        id: 123456789,
        total_price: "150.00",
        currency: "USD",
      });

      const validHmac = crypto
        .createHmac("sha256", secret)
        .update(Buffer.from(payload, "utf8"))
        .digest("base64");

      const res = await request(app)
        .post("/api/integrations/shopify/webhooks")
        .set("x-shopify-topic", "orders/create")
        .set("x-shopify-hmac-sha256", validHmac)
        .set("x-shopify-shop-domain", "test-store.myshopify.com")
        .set("x-shopify-webhook-id", testDeliveryId)
        .set("content-type", "application/json")
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ACCEPTED");
      expect(res.body.eventId).toBeDefined();

      const savedEvent = await prisma.integrationEvent.findUnique({
        where: { deliveryId: testDeliveryId },
      });
      expect(savedEvent).not.toBeNull();
      expect(savedEvent?.topic).toBe("orders/create");
      expect(savedEvent?.tenantId).toBe(testUserId);

      processSpy.mockRestore();
    });

    it("idempotently handles duplicate delivery IDs without duplicate business processing", async () => {
      const payload = JSON.stringify({
        id: 123456789,
        total_price: "150.00",
      });

      const validHmac = crypto
        .createHmac("sha256", secret)
        .update(Buffer.from(payload, "utf8"))
        .digest("base64");

      const res = await request(app)
        .post("/api/integrations/shopify/webhooks")
        .set("x-shopify-topic", "orders/create")
        .set("x-shopify-hmac-sha256", validHmac)
        .set("x-shopify-shop-domain", "test-store.myshopify.com")
        .set("x-shopify-webhook-id", testDeliveryId)
        .set("content-type", "application/json")
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("DUPLICATE");
      expect(res.body.eventId).toBeDefined();

      const count = await prisma.integrationEvent.count({
        where: { deliveryId: testDeliveryId },
      });
      expect(count).toBe(1);
    });
  });
});



