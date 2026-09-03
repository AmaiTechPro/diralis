import {
  IConnectorProvider,
  ConnectionTestResult,
  SourceSchemaDefinition,
  IncrementalSyncBatch,
  SyncCursor,
} from "../../connectorTypes";
import { ShopifyClient } from "./shopifyClient";

export class ShopifyConnectorProvider implements IConnectorProvider {
  public readonly providerId = "shopify";
  public readonly displayName = "Shopify";
  public readonly authType = "OAUTH2" as const;

  /**
   * Validates credentials against the Shopify Admin GraphQL API.
   */
  public async testConnection(config: Record<string, any>): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      const client = new ShopifyClient({
        shop: config.shop,
        accessToken: config.accessToken,
      });

      const testQuery = `
        query PingShop {
          shop {
            id
            name
            myshopifyDomain
          }
        }
      `;

      const res = await client.executeGraphQL<{ shop: { id: string; name: string } }>(testQuery);
      if (!res.data?.shop?.id) {
        return {
          success: false,
          message: "Unable to verify Shopify shop identity.",
          latencyMs: Date.now() - startTime,
        };
      }

      return {
        success: true,
        message: `Successfully connected to Shopify store '${res.data.shop.name}'.`,
        latencyMs: Date.now() - startTime,
        discoveredEntities: ["transactions", "inventory"],
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Shopify connection test failed.",
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Describes source entity schemas.
   */
  public async discoverSchema(_config: Record<string, any>): Promise<SourceSchemaDefinition> {
    return {
      entities: [
        {
          entityName: "transactions",
          fields: [
            { name: "id", type: "string", nullable: false, isPrimaryKey: true },
            { name: "created_at", type: "datetime", nullable: false },
            { name: "total_amount", type: "number", nullable: false },
            { name: "subtotal", type: "number", nullable: true },
            { name: "tax", type: "number", nullable: true },
            { name: "discount", type: "number", nullable: true },
            { name: "currency", type: "string", nullable: false },
            { name: "status", type: "string", nullable: false },
            { name: "storeLocation", type: "string", nullable: true },
          ],
        },
        {
          entityName: "inventory",
          fields: [
            { name: "id", type: "string", nullable: false, isPrimaryKey: true },
            { name: "sku", type: "string", nullable: false },
            { name: "name", type: "string", nullable: false },
            { name: "current_stock", type: "number", nullable: false },
            { name: "unit_cost", type: "number", nullable: true },
            { name: "storeLocation", type: "string", nullable: true },
            { name: "updated_at", type: "datetime", nullable: false },
          ],
        },
      ],
    };
  }

  /**
   * Executes incremental pull from Shopify GraphQL API.
   */
  public async pullIncremental(
    config: Record<string, any>,
    entityName: string,
    cursor: SyncCursor | null,
    limit = 50
  ): Promise<IncrementalSyncBatch> {
    const client = new ShopifyClient({
      shop: config.shop,
      accessToken: config.accessToken,
    });

    if (entityName === "transactions") {
      return this.pullOrders(client, cursor, limit);
    } else if (entityName === "inventory") {
      return this.pullInventory(client, cursor, limit);
    }

    throw new Error(`UNSUPPORTED_ENTITY: Entity '${entityName}' is not supported by Shopify.`);
  }

  /**
   * Pulls Orders from Shopify Admin GraphQL API.
   */
  private async pullOrders(
    client: ShopifyClient,
    cursor: SyncCursor | null,
    limit: number
  ): Promise<IncrementalSyncBatch> {
    // Watermark window strategy: Ensure clean ISO date syntax without enclosing quotes
    let queryFilter = "";
    if (cursor?.lastSyncTimestamp) {
      const watermarkDate = new Date(cursor.lastSyncTimestamp).toISOString();
      queryFilter = `updated_at:>=${watermarkDate}`;
    } else {
      // Bounded initial window: past 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      queryFilter = `created_at:>=${thirtyDaysAgo}`;
    }

    const ordersQuery = `
      query GetOrders($first: Int!, $after: String, $query: String) {
        orders(first: $first, after: $after, query: $query, sortKey: UPDATED_AT) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            cursor
            node {
              id
              name
              createdAt
              updatedAt
              displayFinancialStatus
              physicalLocation {
                id
                name
              }
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              subtotalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              totalTaxSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              totalDiscountsSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `;

    const variables: Record<string, any> = {
      first: Math.min(limit, 100),
      query: queryFilter,
      after: cursor?.paginationToken || null,
    };

    const res = await client.executeGraphQL<{
      orders: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: Array<{
          cursor: string;
          node: {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            displayFinancialStatus: string;
            physicalLocation?: { id: string; name: string };
            totalPriceSet?: { shopMoney: { amount: string; currencyCode: string } };
            subtotalPriceSet?: { shopMoney: { amount: string; currencyCode: string } };
            totalTaxSet?: { shopMoney: { amount: string; currencyCode: string } };
            totalDiscountsSet?: { shopMoney: { amount: string; currencyCode: string } };
          };
        }>;
      };
    }>(ordersQuery, variables);

    const edges = res.data?.orders?.edges || [];
    const pageInfo = res.data?.orders?.pageInfo || { hasNextPage: false, endCursor: null };

    let latestUpdatedAt = cursor?.lastSyncTimestamp;

    const records = edges.map(({ node }) => {
      if (!latestUpdatedAt || new Date(node.updatedAt) > new Date(latestUpdatedAt)) {
        latestUpdatedAt = node.updatedAt;
      }

      return {
        id: node.id,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        total_amount: parseFloat(node.totalPriceSet?.shopMoney?.amount || "0"),
        subtotal: parseFloat(node.subtotalPriceSet?.shopMoney?.amount || "0"),
        tax: parseFloat(node.totalTaxSet?.shopMoney?.amount || "0"),
        discount: parseFloat(node.totalDiscountsSet?.shopMoney?.amount || "0"),
        currency: node.totalPriceSet?.shopMoney?.currencyCode || "USD",
        status: node.displayFinancialStatus || "COMPLETED",
        storeLocation: node.physicalLocation?.name || node.physicalLocation?.id,
        customerRef: node.name,
      };
    });

    const nextCursor: SyncCursor = {
      lastSyncTimestamp: latestUpdatedAt || new Date().toISOString(),
      paginationToken: pageInfo.hasNextPage ? pageInfo.endCursor || undefined : undefined,
    };

    return {
      entityName: "transactions",
      records,
      cursor: nextCursor,
      hasMore: pageInfo.hasNextPage,
    };
  }

  /**
   * Pulls Inventory Items and Levels preserving multi-location granularity.
   */
  private async pullInventory(
    client: ShopifyClient,
    cursor: SyncCursor | null,
    limit: number
  ): Promise<IncrementalSyncBatch> {
    const inventoryQuery = `
      query GetInventory($first: Int!, $after: String) {
        inventoryItems(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            cursor
            node {
              id
              sku
              unitCost {
                amount
                currencyCode
              }
              variant {
                displayName
                product {
                  title
                }
              }
              inventoryLevels(first: 10) {
                edges {
                  node {
                    id
                    updatedAt
                    location {
                      id
                      name
                    }
                    quantities(names: ["available"]) {
                      quantity
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables: Record<string, any> = {
      first: Math.min(limit, 50),
      after: cursor?.paginationToken || null,
    };

    const res = await client.executeGraphQL<{
      inventoryItems: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: Array<{
          cursor: string;
          node: {
            id: string;
            sku?: string;
            unitCost?: { amount: string; currencyCode: string };
            variant?: {
              displayName?: string;
              product?: { title: string };
            };
            inventoryLevels: {
              edges: Array<{
                node: {
                  id: string;
                  updatedAt: string;
                  location: { id: string; name: string };
                  quantities: Array<{ quantity: number }>;
                };
              }>;
            };
          };
        }>;
      };
    }>(inventoryQuery, variables);

    const edges = res.data?.inventoryItems?.edges || [];
    const pageInfo = res.data?.inventoryItems?.pageInfo || { hasNextPage: false, endCursor: null };

    const records: Array<Record<string, any>> = [];

    for (const { node } of edges) {
      const productName =
        node.variant?.product?.title || node.variant?.displayName || node.sku || "Shopify Product";
      const sku = node.sku || node.id;
      const unitCost = node.unitCost?.amount ? parseFloat(node.unitCost.amount) : undefined;

      const levels = node.inventoryLevels?.edges || [];
      if (levels.length === 0) {
        records.push({
          id: node.id,
          sku,
          name: productName,
          current_stock: 0,
          unit_cost: unitCost,
          updated_at: new Date().toISOString(),
        });
      } else {
        for (const levelEdge of levels) {
          const level = levelEdge.node;
          const availableStock = level.quantities?.[0]?.quantity ?? 0;
          const compoundId = `${node.id}#${level.location.id}`;

          records.push({
            id: compoundId,
            sku,
            name: productName,
            current_stock: availableStock,
            availableStock,
            unit_cost: unitCost,
            storeLocation: level.location.name || level.location.id,
            updated_at: level.updatedAt || new Date().toISOString(),
          });
        }
      }
    }

    const nextCursor: SyncCursor = {
      lastSyncTimestamp: cursor?.lastSyncTimestamp || new Date().toISOString(),
      paginationToken: pageInfo.hasNextPage ? pageInfo.endCursor || undefined : undefined,
    };

    return {
      entityName: "inventory",
      records,
      cursor: nextCursor,
      hasMore: pageInfo.hasNextPage,
    };
  }
}

