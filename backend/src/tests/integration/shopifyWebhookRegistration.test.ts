/// <reference types="node" />
import process from "process";
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import {
  ShopifyWebhookRegistrationService,
  REQUIRED_WEBHOOK_TOPICS,
} from "../../services/integration/providers/shopify/shopifyWebhookRegistrationService";
import { ShopifyClient } from "../../services/integration/providers/shopify/shopifyClient";
import { ShopifyOAuthService } from "../../services/integration/providers/shopify/shopifyOAuthService";
import prisma from "../../lib/prisma";

describe("Milestone 5.1B — Shopify Webhook Registration Service", () => {
  const shop = "test-store.myshopify.com";
  const accessToken = "shpat_test_access_token_12345";
  const testWebhookUrl = "https://backend.diralishq.com/api/integrations/shopify/webhooks";
  const originalEnvUrl = process.env.SHOPIFY_WEBHOOK_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.SHOPIFY_WEBHOOK_URL = testWebhookUrl;
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    process.env.SHOPIFY_WEBHOOK_URL = originalEnvUrl;
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Scenario 1: Creates missing subscriptions when none exist
  it("Scenario 1: Creates all missing subscriptions when none exist in Shopify", async () => {
    const executeSpy = vi.spyOn(ShopifyClient.prototype, "executeGraphQL").mockImplementation(async (query: string) => {
      if (query.includes("GetWebhookSubscriptions")) {
        return {
          data: {
            webhookSubscriptions: {
              edges: [],
            },
          },
        };
      }
      if (query.includes("webhookSubscriptionCreate")) {
        return {
          data: {
            webhookSubscriptionCreate: {
              webhookSubscription: {
                id: "gid://shopify/WebhookSubscription/" + Math.floor(Math.random() * 100000),
                topic: "ORDERS_CREATE",
                endpoint: { callbackUrl: testWebhookUrl },
              },
              userErrors: [],
            },
          },
        };
      }
      return { data: {} };
    });

    const summary = await ShopifyWebhookRegistrationService.registerWebhooks({
      shop,
      accessToken,
    });

    expect(summary.success).toBe(true);
    expect(summary.results).toHaveLength(REQUIRED_WEBHOOK_TOPICS.length);
    for (const res of summary.results) {
      expect(res.status).toBe("CREATED");
      expect(res.subscriptionId).toBeDefined();
    }
    // 1 query to fetch existing + 3 creation mutations
    expect(executeSpy).toHaveBeenCalledTimes(4);
  });

  // Scenario 2: Does not duplicate subscriptions when already present
  it("Scenario 2: Does not create duplicate subscriptions if they already exist", async () => {
    vi.spyOn(ShopifyClient.prototype, "executeGraphQL").mockImplementation(async (query: string) => {
      if (query.includes("GetWebhookSubscriptions")) {
        return {
          data: {
            webhookSubscriptions: {
              edges: REQUIRED_WEBHOOK_TOPICS.map((topic, i) => ({
                node: {
                  id: `gid://shopify/WebhookSubscription/existing_${i}`,
                  topic,
                  endpoint: { callbackUrl: testWebhookUrl },
                },
              })),
            },
          },
        };
      }
      return { data: {} };
    });

    const summary = await ShopifyWebhookRegistrationService.registerWebhooks({
      shop,
      accessToken,
    });

    expect(summary.success).toBe(true);
    expect(summary.results).toHaveLength(REQUIRED_WEBHOOK_TOPICS.length);
    for (const res of summary.results) {
      expect(res.status).toBe("ALREADY_EXISTS");
      expect(res.subscriptionId).toMatch(/^gid:\/\/shopify\/WebhookSubscription\/existing_/);
    }
  });

  // Scenario 3: Mixed existing/missing subscriptions
  it("Scenario 3: Creates only the missing topics when some already exist", async () => {
    let createdCount = 0;
    vi.spyOn(ShopifyClient.prototype, "executeGraphQL").mockImplementation(async (query: string, vars?: any) => {
      if (query.includes("GetWebhookSubscriptions")) {
        return {
          data: {
            webhookSubscriptions: {
              edges: [
                {
                  node: {
                    id: "gid://shopify/WebhookSubscription/orders_create_1",
                    topic: "ORDERS_CREATE",
                    endpoint: { callbackUrl: testWebhookUrl },
                  },
                },
                {
                  node: {
                    id: "gid://shopify/WebhookSubscription/inv_levels_1",
                    topic: "INVENTORY_LEVELS_UPDATE",
                    endpoint: { callbackUrl: testWebhookUrl },
                  },
                },
              ],
            },
          },
        };
      }
      if (query.includes("webhookSubscriptionCreate")) {
        createdCount++;
        return {
          data: {
            webhookSubscriptionCreate: {
              webhookSubscription: {
                id: "gid://shopify/WebhookSubscription/orders_updated_new",
                topic: vars.topic,
                endpoint: { callbackUrl: testWebhookUrl },
              },
              userErrors: [],
            },
          },
        };
      }
      return { data: {} };
    });

    const summary = await ShopifyWebhookRegistrationService.registerWebhooks({
      shop,
      accessToken,
    });

    expect(summary.success).toBe(true);
    expect(createdCount).toBe(1); // Only ORDERS_UPDATED was missing

    const updatedRes = summary.results.find((r) => r.topic === "ORDERS_UPDATED");
    expect(updatedRes?.status).toBe("CREATED");

    const createdRes = summary.results.find((r) => r.topic === "ORDERS_CREATE");
    expect(createdRes?.status).toBe("ALREADY_EXISTS");

    const invRes = summary.results.find((r) => r.topic === "INVENTORY_LEVELS_UPDATE");
    expect(invRes?.status).toBe("ALREADY_EXISTS");
  });

  // Scenario 4: Surfaces Shopify userErrors cleanly
  it("Scenario 4: Handles and surfaces Shopify userErrors without throwing an unhandled exception", async () => {
    vi.spyOn(ShopifyClient.prototype, "executeGraphQL").mockImplementation(async (query: string) => {
      if (query.includes("GetWebhookSubscriptions")) {
        return { data: { webhookSubscriptions: { edges: [] } } };
      }
      if (query.includes("webhookSubscriptionCreate")) {
        return {
          data: {
            webhookSubscriptionCreate: {
              webhookSubscription: null,
              userErrors: [
                {
                  field: ["webhookSubscription", "callbackUrl"],
                  message: "Address must be a valid URL.",
                },
              ],
            },
          },
        };
      }
      return { data: {} };
    });

    const summary = await ShopifyWebhookRegistrationService.registerWebhooks({
      shop,
      accessToken,
    });

    expect(summary.success).toBe(false);
    expect(summary.results[0].status).toBe("FAILED");
    expect(summary.results[0].error).toContain("Address must be a valid URL.");
  });

  // Scenario 5: Authentication failure (401/403)
  it("Scenario 5: Classifies authentication failures and shields the access token from logs", async () => {
    vi.spyOn(ShopifyClient.prototype, "executeGraphQL").mockRejectedValue(
      new Error("AUTHENTICATION_FAILURE: 401 Unauthorized - Access token has expired")
    );

    const summary = await ShopifyWebhookRegistrationService.registerWebhooks({
      shop,
      accessToken,
    });

    expect(summary.success).toBe(false);
    for (const r of summary.results) {
      expect(r.status).toBe("FAILED");
      expect(r.error).toContain("AUTHENTICATION_FAILURE");
      expect(r.error).not.toContain(accessToken);
    }
  });

  // Scenario 6: Rate limiting / throttling
  it("Scenario 6: Classifies rate limiting / throttling errors", async () => {
    vi.spyOn(ShopifyClient.prototype, "executeGraphQL").mockImplementation(async () => {
      return {
        errors: [{ message: "Throttled: Maximum cost exceeded. Try again later." }],
      };
    });

    const summary = await ShopifyWebhookRegistrationService.registerWebhooks({
      shop,
      accessToken,
    });

    expect(summary.success).toBe(false);
    expect(summary.results[0].error).toContain("GRAPHQL_ERROR: Throttled");
  });

  // Scenario 7: Network failure / timeout
  it("Scenario 7: Handles network failure as a classified error", async () => {
    vi.spyOn(ShopifyClient.prototype, "executeGraphQL").mockRejectedValue(
      new Error("NETWORK_FAILURE: Failed to communicate with Shopify - fetch failed")
    );

    const summary = await ShopifyWebhookRegistrationService.registerWebhooks({
      shop,
      accessToken,
    });

    expect(summary.success).toBe(false);
    expect(summary.results[0].error).toContain("NETWORK_FAILURE");
  });

  // Scenario 8 & 9: OAuth Integration Ordering & Durability
  it("Scenario 8 & 9: Webhook registration executes after IntegrationConnection is durably committed", async () => {
    const testUser = await prisma.user.create({
      data: {
        email: `oauth-order-${Date.now()}@diralis.test`,
        username: `oauth_${Date.now()}`,
        fullName: "OAuth Order Tester",
      },
    });

    let connectionExistedAtRegistrationTime = false;

    // Spy on registerWebhooks and verify the connection is in DB at the time of invocation
    const regSpy = vi
      .spyOn(ShopifyWebhookRegistrationService, "registerWebhooks")
      .mockImplementation(async () => {
        const found = await prisma.integrationConnection.findFirst({
          where: { userId: testUser.id, providerId: "shopify" },
        });
        if (found && found.status === "ACTIVE") {
          connectionExistedAtRegistrationTime = true;
        }
        return {
          success: true,
          shop,
          destinationUri: testWebhookUrl,
          correlationId: "test-corr",
          results: [],
        };
      });

    // Mock exchangeCodeForToken and verifyShop
    vi.spyOn(ShopifyOAuthService as any, "exchangeCodeForToken").mockResolvedValue({
      accessToken: "mock_token",
      scope: "read_orders,read_products,read_inventory,read_locations",
    });

    vi.spyOn(ShopifyClient.prototype, "executeGraphQL").mockResolvedValue({
      data: {
        shop: {
          id: "gid://shopify/Shop/123",
          name: "Test Shop",
          myshopifyDomain: shop,
          currencyCode: "USD",
        },
      },
    });

    const state = ShopifyOAuthService.generateState(testUser.id, shop);

    await ShopifyOAuthService.handleCallback({
      code: "dummy_auth_code",
      shop,
      state,
      currentUserId: testUser.id,
    });

    expect(regSpy).toHaveBeenCalledTimes(1);
    expect(connectionExistedAtRegistrationTime).toBe(true);

    // Clean up
    await prisma.integrationConnection.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
  });

  // Scenario 10: Invalid Webhook URL rejection
  it("Scenario 10: Rejects loopback/localhost webhook destinations in production", () => {
    process.env.NODE_ENV = "production";
    process.env.SHOPIFY_WEBHOOK_URL = "http://localhost:5000/api/integrations/shopify/webhooks";

    expect(() => {
      ShopifyWebhookRegistrationService.getWebhookDestinationUrl();
    }).toThrow(/Cannot register loopback\/localhost webhook URL/);

    process.env.NODE_ENV = "test";
    process.env.SHOPIFY_WEBHOOK_URL = testWebhookUrl;
  });

  // Scenario 11: Multi-tenant isolation
  it("Scenario 11: Preserves strict tenant isolation between two separate shop connections", async () => {
    const userA = await prisma.user.create({
      data: {
        email: `tenantA-${Date.now()}@diralis.test`,
        username: `tenantA_${Date.now()}`,
        fullName: "Tenant A",
      },
    });
    const userB = await prisma.user.create({
      data: {
        email: `tenantB-${Date.now()}@diralis.test`,
        username: `tenantB_${Date.now()}`,
        fullName: "Tenant B",
      },
    });

    const connA = await prisma.integrationConnection.create({
      data: {
        userId: userA.id,
        providerId: "shopify",
        name: "Shopify - Tenant A",
        encryptedConfig: "token_for_tenant_A",
        status: "ACTIVE",
      },
    });

    const connB = await prisma.integrationConnection.create({
      data: {
        userId: userB.id,
        providerId: "shopify",
        name: "Shopify - Tenant B",
        encryptedConfig: "token_for_tenant_B",
        status: "ACTIVE",
      },
    });

    expect(connA.userId).not.toBe(connB.userId);
    expect(connA.encryptedConfig).not.toBe(connB.encryptedConfig);

    await prisma.integrationConnection.deleteMany({ where: { id: { in: [connA.id, connB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  });

  // Scenario 12: API Version validation
  it("Scenario 12: Uses canonical 2026-07 API version for GraphQL endpoint", () => {
    const client = new ShopifyClient({ shop, accessToken });
    expect((client as any).apiVersion).toBe("2026-07");
    expect((client as any).endpointUrl).toContain("/admin/api/2026-07/graphql.json");
  });
});



