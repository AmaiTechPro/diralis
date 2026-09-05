import {
  IConnectorProvider,
  ConnectionTestResult,
  SourceSchemaDefinition,
  SyncCursor,
  IncrementalSyncBatch,
} from "../../connectorTypes";
import { WooCommerceClient, WooCommerceConfig } from "./woocommerceClient";

export class WooCommerceConnectorProvider implements IConnectorProvider {
  public readonly providerId = "woocommerce";
  public readonly displayName = "WooCommerce Store";
  public readonly authType = "API_KEY" as const;

  /**
   * Tests store reachability and Consumer Key/Secret validity.
   */
  public async testConnection(config: Record<string, any>): Promise<ConnectionTestResult> {
    const start = Date.now();
    try {
      const client = new WooCommerceClient(config as WooCommerceConfig);
      const res = await client.verifyCredentials();

      return {
        success: true,
        message: `Successfully connected to ${res.storeName} (Currency: ${res.currency}).`,
        latencyMs: Date.now() - start,
        discoveredEntities: ["transactions", "inventory"],
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to authenticate with WooCommerce REST API.",
        latencyMs: Date.now() - start,
      };
    }
  }

  /**
   * Exposes canonical entity schemas for mapping validation.
   */
  public async discoverSchema(): Promise<SourceSchemaDefinition> {
    return {
      entities: [
        {
          entityName: "transactions",
          fields: [
            { name: "id", type: "string", nullable: false, isPrimaryKey: true },
            { name: "order_number", type: "string", nullable: false },
            { name: "transactionDate", type: "datetime", nullable: false },
            { name: "totalAmount", type: "number", nullable: false },
            { name: "subtotal", type: "number", nullable: false },
            { name: "tax", type: "number", nullable: true },
            { name: "discount", type: "number", nullable: true },
            { name: "currency", type: "string", nullable: false },
            { name: "status", type: "string", nullable: false },
          ],
        },
        {
          entityName: "inventory",
          fields: [
            { name: "id", type: "string", nullable: false, isPrimaryKey: true },
            { name: "sku", type: "string", nullable: true },
            { name: "productName", type: "string", nullable: false },
            { name: "category", type: "string", nullable: true },
            { name: "currentStock", type: "number", nullable: false },
            { name: "price", type: "number", nullable: true },
          ],
        },
      ],
    };
  }

  /**
   * Pulls an incremental batch of orders or catalog items.
   */
  public async pullIncremental(
    config: Record<string, any>,
    entityName: string,
    cursor: SyncCursor | null,
    limit: number = 100
  ): Promise<IncrementalSyncBatch> {
    const client = new WooCommerceClient(config as WooCommerceConfig);
    const currentPage = cursor?.paginationToken ? Number(cursor.paginationToken) : 1;

    if (entityName === "transactions") {
      const res = await client.getOrders({
        page: currentPage,
        per_page: limit,
        after: cursor?.lastSyncTimestamp,
        order: "asc",
        orderby: "date",
      });

      const orders = res.orders || [];

      // Map WooCommerce order structure into normalized tabular records
      const records = orders.map((order) => {
        const totalAmount = parseFloat(order.total || "0");
        const tax = parseFloat(order.total_tax || "0");
        const discount = parseFloat(order.discount_total || "0");
        const subtotal = Math.max(0, totalAmount - tax + discount);

        return {
          externalId: String(order.id),
          orderNumber: order.number || String(order.id),
          transactionDate: new Date(order.date_created || Date.now()),
          currency: order.currency || "USD",
          totalAmount,
          subtotal,
          tax,
          discount,
          status: order.status,
          customerEmail: order.billing?.email || null,
          lineItemsCount: order.line_items?.length || 0,
        };
      });

      // Maintain cursor: if there are more pages in this window, advance page token;
      // otherwise, advance the lastSyncTimestamp watermark to the latest order's date.
      const nextCursor: SyncCursor = {
        paginationToken: res.hasMore ? String(res.nextPage) : undefined,
        lastSyncTimestamp:
          orders.length > 0 && !res.hasMore
            ? orders[orders.length - 1].date_created
            : cursor?.lastSyncTimestamp,
      };

      return {
        entityName,
        records,
        cursor: nextCursor,
        hasMore: res.hasMore,
      };
    }

    if (entityName === "inventory") {
      const res = await client.getProducts({
        page: currentPage,
        per_page: limit,
        after: cursor?.lastSyncTimestamp,
      });

      const products = res.products || [];

      const records = products.map((prod) => ({
        externalId: String(prod.id),
        sku: prod.sku || String(prod.id),
        productName: prod.name || "Unnamed Product",
        category: prod.categories?.[0]?.name || "General",
        currentStock: prod.manage_stock && prod.stock_quantity !== null ? prod.stock_quantity : (prod.stock_status === "instock" ? 1 : 0),
        price: parseFloat(prod.price || "0"),
        status: prod.status,
      }));

      const nextCursor: SyncCursor = {
        paginationToken: res.hasMore ? String(res.nextPage) : undefined,
        lastSyncTimestamp:
          products.length > 0 && !res.hasMore
            ? products[products.length - 1].date_created
            : cursor?.lastSyncTimestamp,
      };

      return {
        entityName,
        records,
        cursor: nextCursor,
        hasMore: res.hasMore,
      };
    }

    throw new Error(`UNSUPPORTED_ENTITY: Entity '${entityName}' is not supported by WooCommerce connector.`);
  }
}



