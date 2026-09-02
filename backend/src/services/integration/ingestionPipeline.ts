import prisma from "../../lib/prisma";
import { VaultService } from "./vaultService";
import { ConnectionService } from "./connectionService";
import { NormalizationService } from "./normalizationService";
import { SyncMapBridge } from "./syncMapBridge";
import { EntitlementService } from "../entitlementService";
import { CopilotLogger } from "../copilot/copilotLogger";

export interface IngestionResult {
  jobId: string;
  status: "COMPLETED" | "FAILED" | "PARTIAL";
  recordsFetched: number;
  recordsAccepted: number;
  recordsRejected: number;
  recordsDeduplicated: number;
  mapRefreshStatus: string;
  cursorAdvanced: boolean;
  errorMessage?: string;
}

export class IngestionPipeline {
  /**
   * Runs a complete provider-to-canonical ingestion cycle with strict cursor checkpointing.
   */
  public static async executeSync(params: {
    userId: string;
    connectionId: string;
    entityName: "transactions" | "inventory";
    limit?: number;
    correlationId?: string;
  }): Promise<IngestionResult> {
    const correlationId = params.correlationId || CopilotLogger.createCorrelationId();

    // 1. Tenant & Connection Isolation Check
    const connection = await prisma.integrationConnection.findFirst({
      where: { id: params.connectionId, userId: params.userId },
      include: { mappings: true },
    });

    if (!connection) {
      throw new Error("UNAUTHORIZED_CONNECTION: Connection does not exist or unauthorized.");
    }

    // 2. Entitlement Check
    const entitlement = await EntitlementService.evaluateConnectorAccess(params.userId, { correlationId });
    if (!entitlement.allowed) {
      throw new Error(`PLAN_NOT_ENTITLED: ${entitlement.message}`);
    }

    // 3. Create SyncJob in RUNNING state
    const syncJob = await prisma.syncJob.create({
      data: {
        connectionId: connection.id,
        userId: params.userId,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    let recordsFetched = 0;
    let recordsAccepted = 0;
    let recordsRejected = 0;
    let recordsDeduplicated = 0;
    let cursorAdvanced = false;

    try {
      // 4. Resolve Provider & Decrypt Configuration safely
      const provider = ConnectionService.getProvider(connection.providerId);
      const decryptedConfig = VaultService.decrypt<Record<string, any>>(connection.encryptedConfig);

      // 5. Pull Incremental Batch
      const currentCursor = (connection.cursor as any) || null;
      const batch = await provider.pullIncremental(
        decryptedConfig,
        params.entityName,
        currentCursor,
        params.limit || 100
      );

      recordsFetched = batch.records.length;

      // 6. Resolve Field Mapping
      const entityMapping = connection.mappings.find((m) => m.sourceEntity === params.entityName);
      const fieldMap = (entityMapping?.fieldMappings as Record<string, string>) || {};

      // 7. Normalize & Validate
      if (params.entityName === "transactions") {
        const { accepted, rejected } = NormalizationService.normalizeTransactions(batch.records, fieldMap);
        recordsAccepted = accepted.length;
        recordsRejected = rejected.length;

        // 8. Transactional Deduplicated Persistence
        await prisma.$transaction(async (tx) => {
          for (const item of accepted) {
            const existing = await tx.canonicalTransaction.findUnique({
              where: {
                connectionId_externalId: {
                  connectionId: connection.id,
                  externalId: item.externalId,
                },
              },
            });

            if (existing) {
              recordsDeduplicated++;
            }

            await tx.canonicalTransaction.upsert({
              where: {
                connectionId_externalId: {
                  connectionId: connection.id,
                  externalId: item.externalId,
                },
              },
              create: {
                userId: params.userId,
                connectionId: connection.id,
                ...item,
              },
              update: {
                ...item,
                updatedAt: new Date(),
              },
            });
          }

          // Advance cursor ONLY inside transaction commit boundary
          if (batch.cursor) {
            await tx.integrationConnection.update({
              where: { id: connection.id },
              data: {
                cursor: batch.cursor,
                lastSyncAt: new Date(),
                errorDetails: null,
              },
            });
            cursorAdvanced = true;
          }
        });
      } else {
        const { accepted, rejected } = NormalizationService.normalizeInventory(batch.records, fieldMap);
        recordsAccepted = accepted.length;
        recordsRejected = rejected.length;

        await prisma.$transaction(async (tx) => {
          for (const item of accepted) {
            const existing = await tx.canonicalInventoryItem.findUnique({
              where: {
                connectionId_externalId: {
                  connectionId: connection.id,
                  externalId: item.externalId,
                },
              },
            });

            if (existing) {
              recordsDeduplicated++;
            }

            await tx.canonicalInventoryItem.upsert({
              where: {
                connectionId_externalId: {
                  connectionId: connection.id,
                  externalId: item.externalId,
                },
              },
              create: {
                userId: params.userId,
                connectionId: connection.id,
                ...item,
              },
              update: {
                ...item,
                updatedAt: new Date(),
              },
            });
          }

          if (batch.cursor) {
            await tx.integrationConnection.update({
              where: { id: connection.id },
              data: {
                cursor: batch.cursor,
                lastSyncAt: new Date(),
                errorDetails: null,
              },
            });
            cursorAdvanced = true;
          }
        });
      }

      // 9. MAP Refresh with Failure Isolation
      const mapResult = await SyncMapBridge.refreshProfile({
        userId: params.userId,
        connectionId: connection.id,
        entityType: params.entityName,
        correlationId,
      });

      const mapStatus = mapResult.success ? "SUCCESS" : "FAILED";

      // 10. Finalize SyncJob in COMPLETED state
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: "COMPLETED",
          recordsFetched,
          recordsIngested: recordsAccepted,
          recordsAccepted,
          recordsRejected,
          recordsDeduplicated,
          mapRefreshStatus: mapStatus,
          completedAt: new Date(),
        },
      });

      return {
        jobId: syncJob.id,
        status: "COMPLETED",
        recordsFetched,
        recordsAccepted,
        recordsRejected,
        recordsDeduplicated,
        mapRefreshStatus: mapStatus,
        cursorAdvanced,
      };
    } catch (err: any) {
      // On failure, update SyncJob with safe error details without credentials
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: "FAILED",
          recordsFetched,
          recordsAccepted,
          recordsRejected,
          recordsDeduplicated,
          errorMessage: err.message || "SYNC_EXECUTION_ERROR",
          completedAt: new Date(),
        },
      });

      return {
        jobId: syncJob.id,
        status: "FAILED",
        recordsFetched,
        recordsAccepted,
        recordsRejected,
        recordsDeduplicated,
        mapRefreshStatus: "SKIPPED",
        cursorAdvanced: false,
        errorMessage: err.message,
      };
    }
  }
}


