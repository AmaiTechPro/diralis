import crypto from "crypto";
import { ShopifyClient } from "./shopifyClient";

export type ShopifyWebhookTopic =
  | "ORDERS_CREATE"
  | "ORDERS_UPDATED"
  | "INVENTORY_LEVELS_UPDATE";

export const REQUIRED_WEBHOOK_TOPICS: ShopifyWebhookTopic[] = [
  "ORDERS_CREATE",
  "ORDERS_UPDATED",
  "INVENTORY_LEVELS_UPDATE",
];

export interface WebhookRegistrationResultItem {
  topic: ShopifyWebhookTopic;
  status: "CREATED" | "ALREADY_EXISTS" | "FAILED";
  subscriptionId?: string;
  error?: string;
}

export interface WebhookRegistrationSummary {
  success: boolean;
  shop: string;
  destinationUri: string;
  results: WebhookRegistrationResultItem[];
  correlationId: string;
}

interface WebhookSubscriptionsQueryResult {
  webhookSubscriptions: {
    edges: Array<{
      node: {
        id: string;
        topic: string;
        endpoint: {
          __typename?: string;
          callbackUrl?: string;
        };
      };
    }>;
  };
}

interface WebhookSubscriptionCreateResult {
  webhookSubscriptionCreate: {
    webhookSubscription?: {
      id: string;
      topic: string;
      endpoint?: {
        __typename?: string;
        callbackUrl?: string;
      };
    } | null;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}

export class ShopifyWebhookRegistrationService {
  /**
   * Resolves and validates the public destination URL for Shopify webhooks.
   */
  public static getWebhookDestinationUrl(): string {
    const rawUrl =
      process.env.SHOPIFY_WEBHOOK_URL ||
      (process.env.BACKEND_PUBLIC_URL
        ? `${process.env.BACKEND_PUBLIC_URL.replace(/\/+$/, "")}/api/integrations/shopify/webhooks`
        : "");

    if (!rawUrl) {
      throw new Error(
        "CONFIGURATION_ERROR: Neither SHOPIFY_WEBHOOK_URL nor BACKEND_PUBLIC_URL is configured."
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error(`VALIDATION_ERROR: Webhook URL "${rawUrl}" is not a valid URL.`);
    }

    const isProduction = process.env.NODE_ENV === "production";
    const hostname = parsed.hostname.toLowerCase();

    if (
      isProduction &&
      (hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname.endsWith(".local"))
    ) {
      throw new Error(
        `VALIDATION_ERROR: Cannot register loopback/localhost webhook URL ("${rawUrl}") in production.`
      );
    }

    return parsed.toString();
  }

  /**
   * Idempotently registers all required Shopify webhook subscriptions for a shop.
   */
  public static async registerWebhooks(params: {
    shop: string;
    accessToken: string;
    correlationId?: string;
  }): Promise<WebhookRegistrationSummary> {
    const correlationId = params.correlationId || crypto.randomUUID();
    const sanitizedShop = ShopifyClient.sanitizeShopDomain(params.shop);
    const destinationUri = this.getWebhookDestinationUrl();

    const client = new ShopifyClient({
      shop: sanitizedShop,
      accessToken: params.accessToken,
    });

    const results: WebhookRegistrationResultItem[] = [];

    // 1. Query existing subscriptions to ensure idempotency
    let existingSubscriptionsMap = new Map<string, string>(); // key: `${topic}::${callbackUrl}` -> subscriptionId
    try {
      const existing = await this.fetchExistingSubscriptions(client);
      existingSubscriptionsMap = existing;
    } catch (err: any) {
      console.error(
        `[ShopifyWebhookRegistration] correlationId=${correlationId} shop=${sanitizedShop} Failed to inspect existing subscriptions:`,
        err.message
      );
      // Surface transient or auth errors immediately
      return {
        success: false,
        shop: sanitizedShop,
        destinationUri,
        correlationId,
        results: REQUIRED_WEBHOOK_TOPICS.map((topic) => ({
          topic,
          status: "FAILED",
          error: `FETCH_EXISTING_FAILED: ${err.message}`,
        })),
      };
    }

    // 2. Iterate each required topic and create only if missing
    for (const topic of REQUIRED_WEBHOOK_TOPICS) {
      const lookupKey = `${topic}::${destinationUri}`;
      const existingId = existingSubscriptionsMap.get(lookupKey);

      if (existingId) {
        console.log(
          `[ShopifyWebhookRegistration] correlationId=${correlationId} shop=${sanitizedShop} topic=${topic} status=ALREADY_EXISTS subscriptionId=${existingId}`
        );
        results.push({
          topic,
          status: "ALREADY_EXISTS",
          subscriptionId: existingId,
        });
        continue;
      }

      // Create missing subscription via GraphQL mutation
      try {
        const createResult = await this.createSubscription(client, topic, destinationUri);
        if (createResult.subscriptionId) {
          console.log(
            `[ShopifyWebhookRegistration] correlationId=${correlationId} shop=${sanitizedShop} topic=${topic} status=CREATED subscriptionId=${createResult.subscriptionId}`
          );
          results.push({
            topic,
            status: "CREATED",
            subscriptionId: createResult.subscriptionId,
          });
        } else {
          console.warn(
            `[ShopifyWebhookRegistration] correlationId=${correlationId} shop=${sanitizedShop} topic=${topic} status=FAILED error=${createResult.error}`
          );
          results.push({
            topic,
            status: "FAILED",
            error: createResult.error || "UNKNOWN_USER_ERROR",
          });
        }
      } catch (err: any) {
        console.error(
          `[ShopifyWebhookRegistration] correlationId=${correlationId} shop=${sanitizedShop} topic=${topic} status=FAILED error=${err.message}`
        );
        results.push({
          topic,
          status: "FAILED",
          error: err.message,
        });
      }
    }

    const allSucceeded = results.every((r) => r.status === "CREATED" || r.status === "ALREADY_EXISTS");

    return {
      success: allSucceeded,
      shop: sanitizedShop,
      destinationUri,
      correlationId,
      results,
    };
  }

  private static async fetchExistingSubscriptions(
    client: ShopifyClient
  ): Promise<Map<string, string>> {
    const query = `
      query GetWebhookSubscriptions {
        webhookSubscriptions(first: 50) {
          edges {
            node {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }
    `;

    const res = await client.executeGraphQL<WebhookSubscriptionsQueryResult>(query);

    if (res.errors && res.errors.length > 0) {
      throw new Error(`GRAPHQL_ERROR: ${res.errors.map((e) => e.message).join("; ")}`);
    }

    const map = new Map<string, string>();
    const edges = res.data?.webhookSubscriptions?.edges || [];

    for (const edge of edges) {
      const node = edge.node;
      const callbackUrl = node.endpoint?.callbackUrl;
      if (node.topic && callbackUrl) {
        map.set(`${node.topic}::${callbackUrl}`, node.id);
      }
    }

    return map;
  }

  private static async createSubscription(
    client: ShopifyClient,
    topic: ShopifyWebhookTopic,
    callbackUrl: string
  ): Promise<{ subscriptionId?: string; error?: string }> {
    const mutation = `
      mutation webhookSubscriptionCreate(
        $topic: WebhookSubscriptionTopic!,
        $webhookSubscription: WebhookSubscriptionInput!
      ) {
        webhookSubscriptionCreate(
          topic: $topic,
          webhookSubscription: $webhookSubscription
        ) {
          webhookSubscription {
            id
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      topic,
      webhookSubscription: {
        callbackUrl,
        format: "JSON",
      },
    };

    const res = await client.executeGraphQL<WebhookSubscriptionCreateResult>(mutation, variables);

    if (res.errors && res.errors.length > 0) {
      return { error: `GRAPHQL_ERROR: ${res.errors.map((e) => e.message).join("; ")}` };
    }

    const payload = res.data?.webhookSubscriptionCreate;
    if (payload?.userErrors && payload.userErrors.length > 0) {
      return {
        error: `USER_ERROR: ${payload.userErrors.map((u) => `${u.field.join(".")}: ${u.message}`).join("; ")}`,
      };
    }

    if (payload?.webhookSubscription?.id) {
      return { subscriptionId: payload.webhookSubscription.id };
    }

    return { error: "EMPTY_SUBSCRIPTION_RESPONSE" };
  }
}




