import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../lib/prisma";
import { ShopifyClient } from "../services/integration/providers/shopify/shopifyClient";
import { ShopifyOAuthService } from "../services/integration/providers/shopify/shopifyOAuthService";
import { ShopifyConnectorProvider } from "../services/integration/providers/shopify/shopifyConnectorProvider";
import { ConnectionService } from "../services/integration/connectionService";
import { SyncOrchestratorService } from "../services/integration/syncOrchestratorService";
import { VaultService } from "../services/integration/vaultService";
import { EntitlementService } from "../services/entitlementService";
import { SyncMapBridge } from "../services/integration/syncMapBridge";

describe("Milestone 4.4 — Shopify POS Connector Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("A. Shop Domain Sanitization & SSRF Prevention", () => {
    it("normalizes a bare shop name into a full myshopify.com domain", () => {
      const sanitized = ShopifyClient.sanitizeShopDomain("my-urban-boutique");
      expect(sanitized).toBe("my-urban-boutique.myshopify.com");
    });

    it("strips https:// prefix and trailing slashes safely", () => {
      const sanitized = ShopifyClient.sanitizeShopDomain("https://artisan-crafts.myshopify.com/");
      expect(sanitized).toBe("artisan-crafts.myshopify.com");
    });

    it("rejects arbitrary external hostnames to prevent SSRF", () => {
      expect(() => ShopifyClient.sanitizeShopDomain("malicious-site.com")).toThrow("INVALID_SHOP_DOMAIN");
      expect(() => ShopifyClient.sanitizeShopDomain("192.168.1.1")).toThrow("INVALID_SHOP_DOMAIN");
      expect(() => ShopifyClient.sanitizeShopDomain("localhost:8080")).toThrow("INVALID_SHOP_DOMAIN");
    });

    it("rejects invalid characters and injection attempts", () => {
      expect(() => ShopifyClient.sanitizeShopDomain("shop; DROP TABLE orders;")).toThrow("INVALID_SHOP_DOMAIN");
      expect(() => ShopifyClient.sanitizeShopDomain("../../../etc/passwd")).toThrow("INVALID_SHOP_DOMAIN");
    });
  });

  describe("B. OAuth 2.0 State Security & Tenant Binding", () => {
    it("generates a signed state containing userId and shop", () => {
      const state = ShopifyOAuthService.generateState("user_tenant_1", "demo-store");
      expect(state).toContain(".");
      const payload = ShopifyOAuthService.validateState(state, "user_tenant_1");
      expect(payload.userId).toBe("user_tenant_1");
      expect(payload.shop).toBe("demo-store.myshopify.com");
    });

    it("rejects tampered OAuth state signatures", () => {
      const state = ShopifyOAuthService.generateState("user_tenant_1", "demo-store");
      const [data] = state.split(".");
      const tampered = `${data}.tampered_signature`;
      expect(() => ShopifyOAuthService.validateState(tampered)).toThrow("INVALID_OAUTH_STATE");
    });

    it("rejects state when expected tenant does not match", () => {
      const state = ShopifyOAuthService.generateState("user_tenant_1", "demo-store");
      expect(() => ShopifyOAuthService.validateState(state, "user_tenant_2")).toThrow(
        "UNAUTHORIZED_TENANT_ACCESS"
      );
    });

    it("builds an authorization URL with required read-only scopes", () => {
      const { url, state } = ShopifyOAuthService.buildAuthorizationUrl({
        userId: "user_tenant_1",
        shop: "demo-store",
      });
      expect(url).toContain("https://demo-store.myshopify.com/admin/oauth/authorize");
      expect(url).toContain("read_orders");
      expect(url).toContain("read_inventory");
      expect(url).toContain("read_products");
      expect(url).toContain("read_locations");
      expect(url).toContain(encodeURIComponent(state));
    });
  });

  describe("C. Error Classification & Rate Limiting", () => {
    it("classifies HTTP 401/403 as AUTHENTICATION_FAILURE", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 401,
        headers: new Headers(),
        json: async () => ({ errors: "Invalid API key" }),
      } as any);

      const client = new ShopifyClient({
        shop: "test-store.myshopify.com",
        accessToken: "test_token",
      });

      await expect(client.executeGraphQL("{ shop { id } }")).rejects.toThrow("AUTHENTICATION_FAILURE");
    });

    it("classifies HTTP 429 as RATE_LIMITED", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 429,
        headers: new Headers({ "Retry-After": "2.0" }),
        json: async () => ({ errors: "Throttled" }),
      } as any);

      const client = new ShopifyClient({
        shop: "test-store.myshopify.com",
        accessToken: "test_token",
      });

      await expect(client.executeGraphQL("{ shop { id } }")).rejects.toThrow("RATE_LIMITED");
    });

    it("classifies GraphQL cost THROTTLED extension as RATE_LIMITED", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        json: async () => ({
          errors: [
            {
              message: "Throttled",
              extensions: { code: "THROTTLED" },
            },
          ],
        }),
      } as any);

      const client = new ShopifyClient({
        shop: "test-store.myshopify.com",
        accessToken: "test_token",
      });

      await expect(client.executeGraphQL("{ shop { id } }")).rejects.toThrow("RATE_LIMITED");
    });
  });

  describe("D. Multi-Location Inventory Preservation", () => {
    it("preserves inventory levels across multiple retail locations without collapsing", async () => {
      const provider = new ShopifyConnectorProvider();

      vi.spyOn(ShopifyClient.prototype, "executeGraphQL").mockResolvedValueOnce({
        data: {
          inventoryItems: {
            pageInfo: { hasNextPage: false, endCursor: null },
            edges: [
              {
                cursor: "cur_1",
                node: {
                  id: "gid://shopify/InventoryItem/101",
                  sku: "SHIRT-BLK-M",
                  unitCost: { amount: "15.00", currencyCode: "USD" },
                  variant: {
                    displayName: "Classic Black Shirt - M",
                    product: { title: "Classic Black Shirt" },
                  },
                  inventoryLevels: {
                    edges: [
                      {
                        node: {
                          id: "gid://shopify/InventoryLevel/101?location_id=loc_nairobi",
                          updatedAt: "2026-09-01T10:00:00Z",
                          location: { id: "gid://shopify/Location/loc_nairobi", name: "Nairobi CBD Store" },
                          quantities: [{ quantity: 18 }],
                        },
                      },
                      {
                        node: {
                          id: "gid://shopify/InventoryLevel/101?location_id=loc_mombasa",
                          updatedAt: "2026-09-01T10:00:00Z",
                          location: { id: "gid://shopify/Location/loc_mombasa", name: "Mombasa Outlet" },
                          quantities: [{ quantity: 7 }],
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      });

      const batch = await provider.pullIncremental(
        { shop: "retail-brand.myshopify.com", accessToken: "shpat_test" },
        "inventory",
        null
      );

      expect(batch.records).toHaveLength(2);
      expect(batch.records[0].id).toBe("gid://shopify/InventoryItem/101#gid://shopify/Location/loc_nairobi");
      expect(batch.records[0].current_stock).toBe(18);
      expect(batch.records[0].storeLocation).toBe("Nairobi CBD Store");

      expect(batch.records[1].id).toBe("gid://shopify/InventoryItem/101#gid://shopify/Location/loc_mombasa");
      expect(batch.records[1].current_stock).toBe(7);
      expect(batch.records[1].storeLocation).toBe("Mombasa Outlet");
    });
  });

  describe("E. End-to-End Vertical Slice: Shopify -> Ingestion -> Canonical -> MAP", () => {
    it("completes full orchestration cycle with zero duplicate records and advances cursor", async () => {
      const testUserId = "user_shopify_prod_1";
      const testConnId = "conn_shopify_prod_1";

      // 1. Mock Entitlements
      vi.spyOn(EntitlementService, "evaluateConnectorAccess").mockResolvedValue({
        allowed: true,
      } as any);

      // 2. Mock MAP Bridge
      const mapSpy = vi.spyOn(SyncMapBridge, "refreshProfile").mockResolvedValue({
        status: "COMPLETED",
        datasetId: "ds_1",
      } as any);

      // 3. Mock Prisma DB models
      const dummyEncryptedConfig = VaultService.encrypt({
        shop: "demo-apparel.myshopify.com",
        accessToken: "shpat_mock_token_secret",
      });

      const mockConnectionRecord = {
        id: testConnId,
        userId: testUserId,
        providerId: "shopify",
        name: "Shopify - Demo Apparel",
        encryptedConfig: dummyEncryptedConfig,
        syncFrequency: "HOURLY",
        status: "ACTIVE",
        syncInProgress: false,
        syncLeaseExpiresAt: null,
        retryCount: 0,
        cursor: null,
        mappings: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncAt: null,
        nextSyncAt: null,
        lastAttemptedAt: null,
        errorDetails: null,
      };

      vi.spyOn(prisma.integrationConnection, "findFirst").mockResolvedValue(mockConnectionRecord as any);
      vi.spyOn(prisma.integrationConnection, "findUnique").mockResolvedValue(mockConnectionRecord as any);
      vi.spyOn(prisma.integrationConnection, "updateMany").mockResolvedValue({ count: 1 } as any);
      vi.spyOn(prisma.integrationConnection, "update").mockResolvedValue(mockConnectionRecord as any);
      vi.spyOn(prisma.syncJob, "create").mockResolvedValue({ id: "job_sh_1" } as any);
      vi.spyOn(prisma.syncJob, "update").mockResolvedValue({} as any);

      // Track upserted records for idempotency check
      const canonicalStore = new Map<string, any>();
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          integrationConnection: {
            update: vi.fn().mockResolvedValue(mockConnectionRecord),
          },
          syncJob: {
            update: vi.fn().mockResolvedValue({ id: "job_sh_1" }),
          },
          canonicalInventoryItem: {
            findUnique: vi.fn().mockResolvedValue(null),
            upsert: vi.fn().mockImplementation(async ({ create }: any) => create),
          },
          canonicalTransaction: {
            findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
              const key = `${where.connectionId_externalId.connectionId}_${where.connectionId_externalId.externalId}`;
              return canonicalStore.get(key) || null;
            }),
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              const key = `${data.connectionId}_${data.externalId}`;
              canonicalStore.set(key, data);
              return data;
            }),
            update: vi.fn().mockImplementation(async ({ data, where }: any) => {
              const key = `${where.connectionId_externalId.connectionId}_${where.connectionId_externalId.externalId}`;
              canonicalStore.set(key, { ...canonicalStore.get(key), ...data });
              return canonicalStore.get(key);
            }),
            upsert: vi.fn().mockImplementation(async ({ where, create, update }: any) => {
              const key = `${where.connectionId_externalId.connectionId}_${where.connectionId_externalId.externalId}`;
              const existing = canonicalStore.get(key);
              if (existing) {
                const updated = { ...existing, ...update };
                canonicalStore.set(key, updated);
                return updated;
              } else {
                canonicalStore.set(key, create);
                return create;
              }
            }),
          },
        };
        return callback(fakeTx);
      });

      // Mock GraphQL orders response
      vi.spyOn(ShopifyClient.prototype, "executeGraphQL").mockResolvedValue({
        data: {
          orders: {
            pageInfo: { hasNextPage: false, endCursor: null },
            edges: [
              {
                cursor: "cursor_order_1",
                node: {
                  id: "gid://shopify/Order/99001",
                  name: "#1001",
                  createdAt: "2026-09-02T12:00:00Z",
                  updatedAt: "2026-09-02T12:05:00Z",
                  displayFinancialStatus: "PAID",
                  physicalLocation: { id: "loc_1", name: "Flagship Nairobi" },
                  totalPriceSet: { shopMoney: { amount: "120.50", currencyCode: "KES" } },
                  subtotalPriceSet: { shopMoney: { amount: "100.00", currencyCode: "KES" } },
                  totalTaxSet: { shopMoney: { amount: "16.00", currencyCode: "KES" } },
                  totalDiscountsSet: { shopMoney: { amount: "4.50", currencyCode: "KES" } },
                },
              },
            ],
          },
        },
      });

      // 4. Run First Sync
      const firstRun = await SyncOrchestratorService.orchestrateSync({
        connectionId: testConnId,
        userId: testUserId,
        entityName: "transactions",
      });

      expect(firstRun.status).toBe("COMPLETED");
      expect(firstRun.recordsFetched).toBe(1);
      expect(firstRun.recordsAccepted).toBe(1);
      expect(canonicalStore.size).toBe(1);
      expect(mapSpy).toHaveBeenCalledTimes(1);

      // 5. Run Second Sync with the exact same records to verify Idempotency
      const secondRun = await SyncOrchestratorService.orchestrateSync({
        connectionId: testConnId,
        userId: testUserId,
        entityName: "transactions",
      });

      expect(secondRun.status).toBe("COMPLETED");
      expect(secondRun.recordsFetched).toBe(1);
      // Canonical store still has exactly 1 item, zero duplication
      expect(canonicalStore.size).toBe(1);
    });
  });
});


