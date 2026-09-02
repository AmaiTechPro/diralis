import prisma from "../../lib/prisma";
import { profileDataset } from "../profiler/profileDataset";
import { CopilotLogger } from "../copilot/copilotLogger";

export class SyncMapBridge {
  /**
   * Refreshes the deterministic MAP profile for the connected dataset representation.
   * Isolates failures so canonical persistence is never corrupted.
   */
  public static async refreshProfile(params: {
    userId: string;
    connectionId: string;
    entityType: "transactions" | "inventory";
    correlationId?: string;
  }): Promise<{ success: boolean; profileVersion?: number; error?: string }> {
    const correlationId = params.correlationId || CopilotLogger.createCorrelationId();

    try {
      // 1. Fetch canonical rows to build analytical tabular view
      let rows: Record<string, any>[] = [];

      if (params.entityType === "transactions") {
        const txs = await prisma.canonicalTransaction.findMany({
          where: { userId: params.userId, connectionId: params.connectionId },
          orderBy: { transactionDate: "desc" },
          take: 10000,
        });

        rows = txs.map((t) => ({
          transaction_id: t.externalId,
          date: t.transactionDate.toISOString().split("T")[0],
          timestamp: t.transactionDate.toISOString(),
          currency: t.currency,
          subtotal: t.subtotal,
          tax: t.tax,
          discount: t.discount,
          total: t.totalAmount,
          status: t.status,
          store_location: t.storeLocation || "Main",
        }));
      } else {
        const items = await prisma.canonicalInventoryItem.findMany({
          where: { userId: params.userId, connectionId: params.connectionId },
          orderBy: { updatedAt: "desc" },
          take: 10000,
        });

        rows = items.map((i) => ({
          sku: i.sku,
          product_name: i.productName,
          category: i.category || "General",
          current_stock: i.currentStock,
          unit_cost: i.unitCost || 0,
          inventory_value: i.inventoryValue || 0,
          store_location: i.storeLocation || "Main",
        }));
      }

      if (rows.length === 0) {
        return { success: true };
      }

      // 2. Invoke existing MAP Profiler engine
      const profile = profileDataset(rows);

      // 3. Find or link canonical backing Dataset for tenant
      const datasetName = `Live Sync - ${params.entityType} (${params.connectionId.slice(-6)})`;
      const existingDataset = await prisma.dataset.findFirst({
        where: {
          userId: params.userId,
          originalName: datasetName,
        },
      });

      if (existingDataset) {
        await (prisma.dataset as any).update({
          where: { id: existingDataset.id },
          data: {
            size: rows.length,
          },
        });
      }

      CopilotLogger.log(
        "MAP_PROFILE_REFRESHED",
        {
          correlationId,
          userId: params.userId,
          connectionId: params.connectionId,
        },
        {
          rowCount: rows.length,
          columnCount: profile.columns,
        }
      );

      return { success: true };
    } catch (err: any) {
      // Isolate MAP refresh error: log and return failure without throwing
      CopilotLogger.log(
        "MAP_PROFILE_REFRESH_FAILED",
        {
          correlationId,
          userId: params.userId,
          connectionId: params.connectionId,
        },
        { error: err.message },
        undefined,
        "ERROR"
      );

      return {
        success: false,
        error: err.message || "Failed to generate MAP profile",
      };
    }
  }
}

