import crypto from "crypto";
import { ShopifyClient } from "./shopifyClient";
import { VaultService } from "../../vaultService";
import prisma from "../../../../lib/prisma";
import { IntegrationStatus, SyncFrequency } from "@prisma/client";
import { ShopifyWebhookRegistrationService } from "./shopifyWebhookRegistrationService";


export interface ShopifyOAuthStatePayload {
  userId: string;
  shop: string;
  timestamp: number;
  nonce: string;
}

export class ShopifyOAuthService {
  public static readonly REQUIRED_SCOPES = [
    "read_orders",
    "read_products",
    "read_inventory",
    "read_locations",
  ];

  private static get clientId(): string {
    return process.env.SHOPIFY_CLIENT_ID || "mock_shopify_client_id";
  }

  private static get clientSecret(): string {
    return process.env.SHOPIFY_CLIENT_SECRET || "mock_shopify_client_secret";
  }

  private static get redirectUri(): string {
    return (
      process.env.SHOPIFY_REDIRECT_URI ||
      "http://localhost:5000/api/integrations/shopify/callback"
    );
  }

  private static get secretKey(): string {
    return process.env.JWT_SECRET || "diralis_oauth_secret_fallback_key";
  }

  /**
   * Generates a signed, tamper-proof, tenant-bound state string.
   */
  public static generateState(userId: string, shop: string): string {
    const payload: ShopifyOAuthStatePayload = {
      userId,
      shop: ShopifyClient.sanitizeShopDomain(shop),
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString("hex"),
    };

    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(data)
      .digest("base64url");

    return `${data}.${signature}`;
  }

  /**
   * Validates state signature, expiration (10 min), and tenant context.
   */
  public static validateState(
    state: string,
    expectedUserId?: string
  ): ShopifyOAuthStatePayload {
    if (!state || !state.includes(".")) {
      throw new Error("INVALID_OAUTH_STATE: Malformed state parameter.");
    }

    const [data, signature] = state.split(".");
    const expectedSig = crypto
      .createHmac("sha256", this.secretKey)
      .update(data)
      .digest("base64url");

    if (signature !== expectedSig) {
      throw new Error("INVALID_OAUTH_STATE: Signature verification failed.");
    }

    let payload: ShopifyOAuthStatePayload;
    try {
      payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    } catch {
      throw new Error("INVALID_OAUTH_STATE: Unable to decode payload.");
    }

    // Expiry check: 10 minutes
    if (Date.now() - payload.timestamp > 10 * 60 * 1000) {
      throw new Error("INVALID_OAUTH_STATE: OAuth state expired.");
    }

    if (expectedUserId && payload.userId !== expectedUserId) {
      throw new Error("UNAUTHORIZED_TENANT_ACCESS: State tenant mismatch.");
    }

    return payload;
  }

  /**
   * Builds the Shopify authorization URL.
   */
  public static buildAuthorizationUrl(params: {
    userId: string;
    shop: string;
  }): { url: string; state: string } {
    const sanitizedShop = ShopifyClient.sanitizeShopDomain(params.shop);
    const state = this.generateState(params.userId, sanitizedShop);
    const scopes = this.REQUIRED_SCOPES.join(",");

    const url = `https://${sanitizedShop}/admin/oauth/authorize?client_id=${encodeURIComponent(
      this.clientId
    )}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(
      this.redirectUri
    )}&state=${encodeURIComponent(state)}`;

    return { url, state };
  }

  /**
   * Exchanges authorization code for an offline access token.
   */
  public static async exchangeCodeForToken(params: {
    shop: string;
    code: string;
  }): Promise<{ accessToken: string; scope: string }> {
    const sanitizedShop = ShopifyClient.sanitizeShopDomain(params.shop);

    const tokenUrl = `https://${sanitizedShop}/admin/oauth/access_token`;
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: params.code,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `AUTHENTICATION_FAILURE: Failed to exchange Shopify token - HTTP ${response.status}: ${errText}`
      );
    }

    const data = (await response.json()) as { access_token?: string; scope?: string };
    if (!data.access_token) {
      throw new Error("AUTHENTICATION_FAILURE: No access_token returned by Shopify.");
    }

    return {
      accessToken: data.access_token,
      scope: data.scope || this.REQUIRED_SCOPES.join(","),
    };
  }

  /**
   * Completes the callback flow: validates state, exchanges code, verifies connection via minimal GraphQL call,
   * encrypts credentials into the vault, and creates or updates the IntegrationConnection.
   */
  public static async handleCallback(params: {
    code: string;
    shop: string;
    state: string;
    currentUserId?: string;
  }) {
    // 1. Validate State and CSRF
    const verifiedState = this.validateState(params.state, params.currentUserId);
    const sanitizedShop = ShopifyClient.sanitizeShopDomain(params.shop);

      if (sanitizedShop !== verifiedState.shop) {
        console.warn(
          `[ShopifyOAuth] Canonical shop mismatch: initiated with "${verifiedState.shop}", returned canonical "${sanitizedShop}". Proceeding with canonical domain.`
        );
      }

    // 2. Exchange authorization code
    const tokenResult = await this.exchangeCodeForToken({
      shop: sanitizedShop,
      code: params.code,
    });

    // 3. Verify shop connection via lightweight GraphQL query
    const client = new ShopifyClient({
      shop: sanitizedShop,
      accessToken: tokenResult.accessToken,
    });

    const verifyQuery = `
      query VerifyShop {
        shop {
          id
          name
          myshopifyDomain
          currencyCode
        }
      }
    `;

    const verifyResult = await client.executeGraphQL<{
      shop: { id: string; name: string; myshopifyDomain: string; currencyCode: string };
    }>(verifyQuery);

    const shopInfo = verifyResult.data?.shop;
    const connectionName = shopInfo?.name
      ? `Shopify - ${shopInfo.name}`
      : `Shopify (${sanitizedShop})`;

    // 4. Encrypt config into Vault
    const encryptedConfig = VaultService.encrypt({
      shop: sanitizedShop,
      accessToken: tokenResult.accessToken,
      scope: tokenResult.scope,
      currencyCode: shopInfo?.currencyCode || "USD",
      shopId: shopInfo?.id,
    });

    // 5. Upsert connection safely for tenant
    const existing = await prisma.integrationConnection.findFirst({
      where: {
        userId: verifiedState.userId,
        providerId: "shopify",
      },
    });

    let connection;
    if (existing) {
      connection = await prisma.integrationConnection.update({
        where: { id: existing.id },
        data: {
          name: connectionName,
          encryptedConfig,
          status: IntegrationStatus.ACTIVE,
          errorDetails: null,
          retryCount: 0,
        },
      });
    } else {
      connection = await prisma.integrationConnection.create({
        data: {
          userId: verifiedState.userId,
          providerId: "shopify",
          name: connectionName,
          encryptedConfig,
          status: IntegrationStatus.ACTIVE,
          syncFrequency: SyncFrequency.HOURLY,
        },
      });
    }

    // 6. Programmatically register required Shopify webhooks
      let webhookRegistration = null;
      try {
        webhookRegistration = await ShopifyWebhookRegistrationService.registerWebhooks({
          shop: sanitizedShop,
          accessToken: tokenResult.accessToken,
        });

        if (!webhookRegistration.success) {
          console.warn(
            `[ShopifyOAuth] Webhook registration completed with partial failures for shop ${sanitizedShop}:`,
            webhookRegistration.results
          );
        }
      } catch (webhookErr: any) {
        console.error(
          `[ShopifyOAuth] Failed to register webhooks during OAuth for shop ${sanitizedShop}:`,
          webhookErr.message
        );
      }

      return {
        connectionId: connection.id,
        shop: sanitizedShop,
        name: connection.name,
        status: connection.status,
        webhookRegistration,
      };


    return {
      connectionId: connection.id,
      shop: sanitizedShop,
      name: connection.name,
      status: connection.status,
    };
  }
}


