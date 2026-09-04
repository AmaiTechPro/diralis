export interface SquareConfig {
  accessToken: string;
  environment?: "sandbox" | "production";
  locationId?: string;
}

export class SquareClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor(config: SquareConfig) {
    this.accessToken = config.accessToken;
    this.baseUrl =
      config.environment === "production"
        ? "https://connect.squareup.com"
        : "https://connect.squareupsandbox.com";
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        "Square-Version": "2024-01-18",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`SQUARE_API_ERROR (${response.status}): ${errorBody}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Tests API credentials by retrieving accessible locations.
   */
  public async getLocations(): Promise<{ locations?: Array<{ id: string; name: string }> }> {
    return this.request<{ locations?: Array<{ id: string; name: string }> }>("/v2/locations");
  }

  /**
   * Queries orders using Square's Orders Search endpoint.
   */
  public async searchOrders(params: {
    locationIds: string[];
    cursor?: string;
    limit?: number;
    beginTime?: string;
  }): Promise<{ orders?: any[]; cursor?: string }> {
    return this.request<{ orders?: any[]; cursor?: string }>("/v2/orders/search", {
      method: "POST",
      body: JSON.stringify({
        location_ids: params.locationIds,
        cursor: params.cursor,
        limit: params.limit || 100,
        query: {
          filter: {
            state_filter: {
              states: ["COMPLETED"],
            },
            ...(params.beginTime
              ? {
                  date_time_filter: {
                    created_at: {
                      start_at: params.beginTime,
                    },
                  },
                }
              : {}),
          },
          sort: {
            sort_field: "CREATED_AT",
            sort_order: "ASC",
          },
        },
      }),
    });
  }

  /**
   * Retrieves catalog items for inventory sync.
   */
  public async listCatalog(cursor?: string): Promise<{ objects?: any[]; cursor?: string }> {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}&types=ITEM` : "?types=ITEM";
    return this.request<{ objects?: any[]; cursor?: string }>(`/v2/catalog/list${query}`);
  }
}


