export interface ShopifyGraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: {
      code?: string;
      cost?: {
        requestedQueryCost: number;
        actualQueryCost?: number;
        throttleStatus?: {
          maximumAvailable: number;
          currentlyAvailable: number;
          restoreRate: number;
        };
      };
      [key: string]: any;
    };
  }>;
  extensions?: {
    cost?: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}

export interface ShopifyClientConfig {
  shop: string;
  accessToken: string;
  apiVersion?: string;
  timeoutMs?: number;
}

export class ShopifyClient {
  public static readonly DEFAULT_API_VERSION = "2024-07";
  private readonly shop: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly timeoutMs: number;

  constructor(config: ShopifyClientConfig) {
    this.shop = ShopifyClient.sanitizeShopDomain(config.shop);
    if (!config.accessToken || typeof config.accessToken !== "string") {
      throw new Error("AUTHENTICATION_FAILURE: Valid Shopify access token is required.");
    }
    this.accessToken = config.accessToken.trim();
    this.apiVersion = config.apiVersion || ShopifyClient.DEFAULT_API_VERSION;
    this.timeoutMs = config.timeoutMs || 15000;
  }

  /**
   * Strictly validates and normalizes shop domain to prevent SSRF and hostname injection.
   */
  public static sanitizeShopDomain(rawShop: string): string {
    if (!rawShop || typeof rawShop !== "string") {
      throw new Error("INVALID_SHOP_DOMAIN: Shop domain must be a non-empty string.");
    }

    let cleaned = rawShop.trim().toLowerCase();
    // Strip protocol if user supplied https:// or http://
    cleaned = cleaned.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    // If user provided just the shop name slug e.g. "my-boutique", append .myshopify.com
    if (!cleaned.includes(".")) {
      cleaned = `${cleaned}.myshopify.com`;
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    if (!domainRegex.test(cleaned)) {
      throw new Error(`INVALID_SHOP_DOMAIN: '${rawShop}' is not a valid myshopify.com domain.`);
    }

    return cleaned;
  }

  public get endpointUrl(): string {
    return `https://${this.shop}/admin/api/${this.apiVersion}/graphql.json`;
  }

  public get shopDomain(): string {
    return this.shop;
  }

  /**
   * Executes a typed GraphQL operation against the Shopify Admin GraphQL API.
   */
  public async executeGraphQL<T = any>(
    query: string,
    variables: Record<string, any> = {}
  ): Promise<ShopifyGraphQLResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(this.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": this.accessToken,
          Accept: "application/json",
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error(`TIMEOUT: Shopify request exceeded ${this.timeoutMs}ms.`);
      }
      throw new Error(`NETWORK_FAILURE: Failed to communicate with Shopify - ${err.message}`);
    } finally {
      clearTimeout(timeout);
    }

    // 401/403: Authentication or Authorization revoked
    if (response.status === 401 || response.status === 403) {
      throw new Error("AUTHENTICATION_FAILURE: Shopify access token is invalid or permissions revoked.");
    }

    // 429: Throttling / Rate limited
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new Error(`RATE_LIMITED: Shopify API rate limit reached. Retry-After: ${retryAfter || "unknown"}`);
    }

    // 5xx: Provider Unavailable
    if (response.status >= 500) {
      throw new Error(`PROVIDER_UNAVAILABLE: Shopify returned HTTP ${response.status}`);
    }

    let parsed: ShopifyGraphQLResponse<T>;
    try {
      parsed = (await response.json()) as ShopifyGraphQLResponse<T>;
    } catch {
      throw new Error(`SCHEMA_FAILURE: Malformed JSON response from Shopify`);
    }

    // Check for GraphQL top-level errors
    if (parsed.errors && parsed.errors.length > 0) {
      const isThrottled = parsed.errors.some(
        (e) => e.extensions?.code === "THROTTLED" || e.message.toLowerCase().includes("throttled")
      );
      if (isThrottled) {
        throw new Error("RATE_LIMITED: GraphQL query cost exceeded available bucket capacity.");
      }

      const isAuthError = parsed.errors.some(
        (e) =>
          e.extensions?.code === "UNAUTHORIZED" ||
          e.extensions?.code === "ACCESS_DENIED" ||
          e.message.toLowerCase().includes("access denied")
      );
      if (isAuthError) {
        throw new Error("AUTHENTICATION_FAILURE: Access denied for requested Shopify resource.");
      }

      throw new Error(`SCHEMA_FAILURE: ${parsed.errors.map((e) => e.message).join("; ")}`);
    }

    return parsed;
  }
}


