import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { WooCommerceClient } from "../services/integration/providers/woocommerce/woocommerceClient";
import { WooCommerceConnectorProvider } from "../services/integration/providers/woocommerce/woocommerceConnectorProvider";
import { WooCommerceWebhookVerifier } from "../services/integration/providers/woocommerce/woocommerceWebhookVerifier";
import { ConnectionService } from "../services/integration/connectionService";

describe("Milestone 6.1 — WooCommerce Strategic Connector Suite", () => {
  const dummyConfig = {
    storeUrl: "https://mystore.example.com",
    consumerKey: "ck_test_1234567890abcdef",
    consumerSecret: "cs_test_abcdef1234567890",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("A. Configuration Validation & REST Client", () => {
    it("throws an error when required configuration fields are missing", () => {
      expect(() => new WooCommerceClient({} as any)).toThrow("INVALID_CONFIG");
      expect(
        () =>
          new WooCommerceClient({
            storeUrl: "https://mystore.com",
            consumerKey: "",
            consumerSecret: "",
          })
      ).toThrow("INVALID_CONFIG");
    });

    it("verifies store credentials successfully against settings endpoint", async () => {
      const mockSettings = [
        { id: "woocommerce_store_name", value: "Diralis Apparel" },
        { id: "woocommerce_currency", value: "USD" },
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "x-wp-total": "2", "x-wp-totalpages": "1" }),
        json: async () => mockSettings,
      } as Response);

      const client = new WooCommerceClient(dummyConfig);
      const result = await client.verifyCredentials();

      expect(result.storeName).toBe("Diralis Apparel");
      expect(result.currency).toBe("USD");
    });

    it("surfaces upstream REST API errors clearly", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => JSON.stringify({ message: "Consumer key is invalid." }),
      } as Response);

      const client = new WooCommerceClient(dummyConfig);
      await expect(client.verifyCredentials()).rejects.toThrow("Consumer key is invalid.");
    });
  });

  describe("B. Provider Schema Discovery & Contract Compliance", () => {
    it("is registered in ConnectionService static providers map", () => {
      const provider = ConnectionService.getProvider("woocommerce");
      expect(provider).toBeDefined();
      expect(provider.providerId).toBe("woocommerce");
      expect(provider.displayName).toBe("WooCommerce Store");
      expect(provider.authType).toBe("API_KEY");
    });

    it("discovers canonical entities schema for transactions and inventory", async () => {
      const provider = new WooCommerceConnectorProvider();
      const schema = await provider.discoverSchema();

      expect(schema.entities).toHaveLength(2);
      const names = schema.entities.map((e) => e.entityName);
      expect(names).toContain("transactions");
      expect(names).toContain("inventory");

      const txFields = schema.entities.find((e) => e.entityName === "transactions")?.fields;
      expect(txFields?.some((f) => f.name === "totalAmount")).toBe(true);
      expect(txFields?.some((f) => f.name === "transactionDate")).toBe(true);
    });

    it("executes testConnection returning structured latency and status", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "x-wp-total": "2", "x-wp-totalpages": "1" }),
        json: async () => [
          { id: "woocommerce_store_name", value: "Flagship Retail" },
          { id: "woocommerce_currency", value: "EUR" },
        ],
      } as Response);

      const provider = new WooCommerceConnectorProvider();
      const testResult = await provider.testConnection(dummyConfig);

      expect(testResult.success).toBe(true);
      expect(testResult.message).toContain("Flagship Retail");
      expect(testResult.message).toContain("EUR");
      expect(testResult.latencyMs).toBeGreaterThanOrEqual(0);
      expect(testResult.discoveredEntities).toEqual(["transactions", "inventory"]);
    });
  });

  describe("C. Incremental Order & Inventory Synchronization", () => {
    it("fetches and maps orders incrementally into canonical transaction records", async () => {
      const mockOrders = [
        {
          id: 501,
          number: "ORD-501",
          status: "completed",
          currency: "USD",
          date_created: "2026-09-01T12:00:00Z",
          total: "120.00",
          total_tax: "10.00",
          discount_total: "5.00",
          line_items: [{ id: 1 }, { id: 2 }],
          billing: { email: "customer@example.com" },
        },
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "x-wp-total": "1", "x-wp-totalpages": "1" }),
        json: async () => mockOrders,
      } as Response);

      const provider = new WooCommerceConnectorProvider();
      const batch = await provider.pullIncremental(dummyConfig, "transactions", null, 50);

      expect(batch.entityName).toBe("transactions");
      expect(batch.records).toHaveLength(1);
      expect(batch.hasMore).toBe(false);

      const record = batch.records[0];
      expect(record.externalId).toBe("501");
      expect(record.orderNumber).toBe("ORD-501");
      expect(record.totalAmount).toBe(120.0);
      expect(record.tax).toBe(10.0);
      expect(record.discount).toBe(5.0);
      expect(record.subtotal).toBe(115.0);
      expect(record.customerEmail).toBe("customer@example.com");
      expect(record.lineItemsCount).toBe(2);
      expect(batch.cursor.lastSyncTimestamp).toBe("2026-09-01T12:00:00Z");
    });

    it("advances pagination token when multiple pages remain", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "x-wp-total": "200", "x-wp-totalpages": "2" }),
        json: async () => [{ id: 1, total: "25.00", date_created: "2026-09-01T10:00:00Z" }],
      } as Response);

      const provider = new WooCommerceConnectorProvider();
      const batch = await provider.pullIncremental(
        dummyConfig,
        "transactions",
        { paginationToken: "1" },
        1
      );

      expect(batch.hasMore).toBe(true);
      expect(batch.cursor.paginationToken).toBe("2");
    });

    it("maps catalog products and resolves stock levels accurately", async () => {
      const mockProducts = [
        {
          id: 101,
          name: "Classic Silk Shirt",
          sku: "SHIRT-SLK-01",
          price: "89.50",
          manage_stock: true,
          stock_quantity: 14,
          stock_status: "instock",
          categories: [{ id: 5, name: "Apparel", slug: "apparel" }],
          date_created: "2026-08-15T08:00:00Z",
        },
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "x-wp-total": "1", "x-wp-totalpages": "1" }),
        json: async () => mockProducts,
      } as Response);

      const provider = new WooCommerceConnectorProvider();
      const batch = await provider.pullIncremental(dummyConfig, "inventory", null, 50);

      expect(batch.entityName).toBe("inventory");
      expect(batch.records).toHaveLength(1);
      const item = batch.records[0];
      expect(item.externalId).toBe("101");
      expect(item.sku).toBe("SHIRT-SLK-01");
      expect(item.productName).toBe("Classic Silk Shirt");
      expect(item.category).toBe("Apparel");
      expect(item.currentStock).toBe(14);
      expect(item.price).toBe(89.5);
    });

    it("throws unsupported entity exception for invalid entity requests", async () => {
      const provider = new WooCommerceConnectorProvider();
      await expect(
        provider.pullIncremental(dummyConfig, "unsupported_table", null)
      ).rejects.toThrow("UNSUPPORTED_ENTITY");
    });
  });

  describe("D. Webhook HMAC-SHA256 Signature Verification", () => {
    const webhookSecret = "super_secret_webhook_key_987";
    const payload = JSON.stringify({
      id: 999,
      status: "completed",
      total: "250.00",
    });

    it("verifies a valid x-wc-webhook-signature accurately", () => {
      const signature = crypto
        .createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("base64");

      const isValid = WooCommerceWebhookVerifier.verifySignature(
        payload,
        signature,
        webhookSecret
      );
      expect(isValid).toBe(true);
    });

    it("rejects an altered or forged webhook payload", () => {
      const signature = crypto
        .createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("base64");

      const tamperedPayload = JSON.stringify({
        id: 999,
        status: "completed",
        total: "25.00",
      });

      const isValid = WooCommerceWebhookVerifier.verifySignature(
        tamperedPayload,
        signature,
        webhookSecret
      );
      expect(isValid).toBe(false);
    });

    it("returns false gracefully on missing signature or secret", () => {
      expect(WooCommerceWebhookVerifier.verifySignature(payload, undefined, webhookSecret)).toBe(
        false
      );
      expect(WooCommerceWebhookVerifier.verifySignature(payload, "dummy_sig", "")).toBe(false);
    });
  });
});


