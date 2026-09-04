import prisma from "../../lib/prisma";
import { VaultService } from "./vaultService";
import { NormalizationService } from "./normalizationService";
import { IntegrationStatus, Prisma } from "@prisma/client";

export interface UniversalIngressResult {
  success: boolean;
  recordsIngested: number;
  recordsRejected: number;
  errors?: string[];
}

export class UniversalIngressService {
  /**
   * Ingests arbitrary JSON transactions for a given connection using its stored key and schema mapping.
   */
  public static async processIngress(params: {
    connectionId: string;
    apiKey: string;
    payload: any;
  }): Promise<UniversalIngressResult> {
    const { connectionId, apiKey, payload } = params;

    // 1. Fetch connection with its mappings
    const connection = await prisma.integrationConnection.findUnique({
      where: { id: connectionId },
      include: { mappings: true },
    });

    if (!connection) {
      throw new Error("CONNECTION_NOT_FOUND: Ingress connection does not exist.");
    }

    if (connection.status === IntegrationStatus.INACTIVE) {
      throw new Error("CONNECTION_DISABLED: This ingress connection is inactive.");
    }

    // 2. Validate API Key from encryptedConfig
    let storedConfig: Record<string, any> = {};
    try {
      storedConfig = VaultService.decrypt<Record<string, any>>(connection.encryptedConfig);
    } catch {
      throw new Error("AUTH_FAILED: Unable to decrypt connection configuration.");
    }

    if (!storedConfig.apiKey || storedConfig.apiKey !== apiKey) {
      throw new Error("UNAUTHORIZED: Invalid x-diralis-key provided for this connection.");
    }

    // 3. Resolve records array (support raw arrays or wrapped payloads e.g. { data: [...] } or { orders: [...] })
    let rawRecords: Record<string, any>[] = [];
    if (Array.isArray(payload)) {
      rawRecords = payload;
    } else if (payload && typeof payload === "object") {
      if (Array.isArray(payload.data)) rawRecords = payload.data;
      else if (Array.isArray(payload.transactions)) rawRecords = payload.transactions;
      else if (Array.isArray(payload.orders)) rawRecords = payload.orders;
      else if (Array.isArray(payload.records)) rawRecords = payload.records;
      else rawRecords = [payload]; // Single transaction payload
    }

    if (rawRecords.length === 0) {
      return { success: true, recordsIngested: 0, recordsRejected: 0 };
    }

    // 4. Resolve field mapping
    const mappingRecord = connection.mappings.find((m) => m.sourceEntity === "transactions");
    const fieldMapping: Record<string, string> =
      mappingRecord && typeof mappingRecord.fieldMappings === "object"
        ? (mappingRecord.fieldMappings as Record<string, string>)
        : {};

    // 5. Normalize using canonical engine
    const normResult = NormalizationService.normalizeTransactions(rawRecords, fieldMapping);

    // 6. Idempotent persistence into CanonicalTransaction
    const accepted = normResult.accepted;
    if (accepted.length > 0) {
      await prisma.$transaction(
        accepted.map((tx) =>
          prisma.canonicalTransaction.upsert({
            where: {
              connectionId_externalId: {
                connectionId: connection.id,
                externalId: tx.externalId,
              },
            },
            create: {
              userId: connection.userId,
              connectionId: connection.id,
              externalId: tx.externalId,
              sourceEntity: tx.sourceEntity || "transactions",
              transactionDate: tx.transactionDate,
              currency: tx.currency || "USD",
              subtotal: tx.subtotal,
              tax: tx.tax,
              discount: tx.discount,
              totalAmount: tx.totalAmount,
              status: tx.status || "COMPLETED",
              customerRef: tx.customerRef || null,
              storeLocation: tx.storeLocation || null,
              sourceMetadata: (tx.sourceMetadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            },
            update: {
              transactionDate: tx.transactionDate,
              currency: tx.currency || "USD",
              subtotal: tx.subtotal,
              tax: tx.tax,
              discount: tx.discount,
              totalAmount: tx.totalAmount,
              status: tx.status || "COMPLETED",
              customerRef: tx.customerRef || null,
              storeLocation: tx.storeLocation || null,
              sourceMetadata: (tx.sourceMetadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            },
          })
        )
      );
    }

    // 7. Update connection sync health & freshness
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: new Date(),
        lastAttemptedAt: new Date(),
        status: IntegrationStatus.ACTIVE,
        retryCount: 0,
        errorDetails: null,
      },
    });

    return {
      success: true,
      recordsIngested: accepted.length,
      recordsRejected: normResult.rejected.length,
      errors: normResult.rejected.map((r) => `${r.reason} (${r.field || "unknown"})`),
    };
  }
}
