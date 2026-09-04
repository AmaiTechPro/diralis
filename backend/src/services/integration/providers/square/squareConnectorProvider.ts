import {
  IConnectorProvider,
  ConnectionTestResult,
  SourceSchemaDefinition,
  SyncCursor,
  IncrementalSyncBatch,
} from "../../connectorTypes";
import { SquareClient, SquareConfig } from "./squareClient";

export class SquareConnectorProvider implements IConnectorProvider {
  public readonly providerId = "square";
  public readonly displayName = "Square POS & Retail";
  public readonly authType = "OAUTH2" as const;

  /**
   * Verifies access by retrieving merchant locations.
   */
  public async testConnection(config: Record<string, any>): Promise<ConnectionTestResult> {
    const start = Date.now();
    try {
      const client = new SquareClient(config as SquareConfig);
      const res = await client.getLocations();

      if (!res.locations || res.locations.length === 0) {
        return {
          success: false,
          message: "No active locations found in this Square account.",
          latencyMs: Date.now() - start,
        };
      }

      return {
        success: true,
        message: `Successfully connected to Square (${res.locations.length} locations discovered).`,
        latencyMs: Date.now() - start,
        discoveredEntities: ["transactions", "inventory"],
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to authenticate with Square.",
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
            { name: "created_at", type: "datetime", nullable: false },
            { name: "total_money", type: "number", nullable: false },
            { name: "total_tax_money", type: "number", nullable: true },
            { name: "total_discount_money", type: "number", nullable: true },
          ],
        },
        {
          entityName: "inventory",
          fields: [
            { name: "id", type: "string", nullable: false, isPrimaryKey: true },
            { name: "name", type: "string", nullable: false },
            { name: "sku", type: "string", nullable: true },
          ],
        },
      ],
    };
  }

  /**
   * Pulls an incremental batch of completed orders or catalog items.
   */
  public async pullIncremental(
    config: Record<string, any>,
    entityName: string,
    cursor: SyncCursor | null,
    limit: number = 100
  ): Promise<IncrementalSyncBatch> {
    const client = new SquareClient(config as SquareConfig);

    if (entityName === "transactions") {
      // Resolve location IDs
      let locationIds = config.locationId ? [config.locationId] : [];
      if (locationIds.length === 0) {
        const locRes = await client.getLocations();
        locationIds = (locRes.locations || []).map((l) => l.id);
      }

      if (locationIds.length === 0) {
        return {
          entityName,
          records: [],
          cursor: cursor || {},
          hasMore: false,
        };
      }

      const res = await client.searchOrders({
        locationIds,
        cursor: cursor?.paginationToken,
        limit,
        beginTime: cursor?.lastSyncTimestamp,
      });

      const orders = res.orders || [];

      // Map Square order structure into normalized tabular records
      const records = orders.map((order: any) => {
        const totalCents = Number(order.total_money?.amount || 0);
        const taxCents = Number(order.total_tax_money?.amount || 0);
        const discountCents = Number(order.total_discount_money?.amount || 0);

        const totalAmount = totalCents / 100;
        const tax = taxCents / 100;
        const discount = discountCents / 100;
        const subtotal = Math.max(0, totalAmount - tax + discount);

        return {
          externalId: order.id,
          transactionDate: new Date(order.created_at || Date.now()),
          currency: order.total_money?.currency || "USD",
          totalAmount,
          subtotal,
          tax,
          discount,
        };
      });

      const nextCursor: SyncCursor = {
        paginationToken: res.cursor,
        lastSyncTimestamp:
          orders.length > 0
            ? orders[orders.length - 1].created_at
            : cursor?.lastSyncTimestamp,
      };

      return {
        entityName,
        records,
        cursor: nextCursor,
        hasMore: Boolean(res.cursor),
      };
    }

    if (entityName === "inventory") {
      const res = await client.listCatalog(cursor?.paginationToken);
      const objects = res.objects || [];

      const records = objects.map((obj: any) => {
        const itemData = obj.item_data || {};
        const firstVariation = itemData.variations?.[0]?.item_variation_data || {};

        return {
          externalId: obj.id,
          sku: firstVariation.sku || obj.id,
          productName: itemData.name || "Unnamed Item",
          category: itemData.category_id || "General",
          currentStock: 0, // Stock counts query separately if needed
        };
      });

      return {
        entityName,
        records,
        cursor: { paginationToken: res.cursor },
        hasMore: Boolean(res.cursor),
      };
    }

    throw new Error(`UNSUPPORTED_ENTITY: Entity '${entityName}' is not supported by Square connector.`);
  }
}



