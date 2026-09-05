export interface WooCommerceConfig {
  storeUrl: string; // e.g. "https://mystore.com"
  consumerKey: string; // "ck_..."
  consumerSecret: string; // "cs_..."
  verifySsl?: boolean;
}

export interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  total: string;
  total_tax: string;
  discount_total: string;
  shipping_total: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    subtotal: string;
    total: string;
    sku: string;
    price: number;
  }>;
  billing?: {
    first_name: string;
    last_name: string;
    email: string;
    country: string;
  };
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  sku: string;
  price: string;
  regular_price: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: "instock" | "outofstock" | "onbackorder";
  categories: Array<{ id: number; name: string; slug: string }>;
  date_created: string;
  date_modified: string;
}

export class WooCommerceClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(private readonly config: WooCommerceConfig) {
    if (!config.storeUrl || !config.consumerKey || !config.consumerSecret) {
      throw new Error("INVALID_CONFIG: storeUrl, consumerKey, and consumerSecret are required.");
    }
    // Normalize URL
    this.baseUrl = config.storeUrl.replace(/\/+$/, "");
    this.authHeader = `Basic ${Buffer.from(
      `${config.consumerKey.trim()}:${config.consumerSecret.trim()}`
    ).toString("base64")}`;
  }

  private async request<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<{ data: T; totalRecords: number; totalPages: number }> {
    const url = new URL(`${this.baseUrl}/wp-json/wc/v3/${endpoint.replace(/^\/+/, "")}`);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        url.searchParams.append(key, String(val));
      }
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        "User-Agent": "Diralis-BI-Connector/1.0",
      },
    });

    if (!response.ok) {
      let errText = await response.text().catch(() => "");
      try {
        const jsonErr = JSON.parse(errText);
        errText = jsonErr.message || errText;
      } catch {}
      throw new Error(`WooCommerce API Error (${response.status}): ${errText || response.statusText}`);
    }

    const totalRecords = Number(response.headers.get("x-wp-total") || "0");
    const totalPages = Number(response.headers.get("x-wp-totalpages") || "1");
    const data = (await response.json()) as T;

    return { data, totalRecords, totalPages };
  }

  /**
   * Quick connection verification against the WooCommerce system status or settings endpoint
   */
  public async verifyCredentials(): Promise<{ storeName: string; currency: string }> {
    const { data } = await this.request<any>("settings/general");
    const titleSetting = data.find((s: any) => s.id === "woocommerce_store_name") ||
      data.find((s: any) => s.id === "blogname");
    const currencySetting = data.find((s: any) => s.id === "woocommerce_currency");

    return {
      storeName: titleSetting?.value || "WooCommerce Store",
      currency: currencySetting?.value || "USD",
    };
  }

  /**
   * Retrieves orders chronologically or modified after a specific timestamp
   */
  public async getOrders(params: {
    page?: number;
    per_page?: number;
    after?: string; // ISO8601
    status?: string;
    order?: "asc" | "desc";
    orderby?: "date" | "modified";
  } = {}): Promise<{ orders: WooCommerceOrder[]; hasMore: boolean; nextPage: number | null }> {
    const page = params.page || 1;
    const per_page = Math.min(params.per_page || 100, 100);

    const { data, totalPages } = await this.request<WooCommerceOrder[]>("orders", {
      page,
      per_page,
      after: params.after,
      status: params.status || "any",
      order: params.order || "asc",
      orderby: params.orderby || "date",
    });

    const hasMore = page < totalPages;
    return {
      orders: data || [],
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    };
  }

  /**
   * Retrieves catalog items & current stock
   */
  public async getProducts(params: {
    page?: number;
    per_page?: number;
    after?: string;
  } = {}): Promise<{ products: WooCommerceProduct[]; hasMore: boolean; nextPage: number | null }> {
    const page = params.page || 1;
    const per_page = Math.min(params.per_page || 100, 100);

    const { data, totalPages } = await this.request<WooCommerceProduct[]>("products", {
      page,
      per_page,
      after: params.after,
      order: "asc",
      orderby: "date",
    });

    const hasMore = page < totalPages;
    return {
      products: data || [],
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    };
  }
}



