import {
  IConnectorProvider,
  ConnectionTestResult,
  SourceSchemaDefinition,
  SyncCursor,
  IncrementalSyncBatch,
} from "../../connectorTypes";

export class UniversalIngressProvider implements IConnectorProvider {
  public readonly providerId = "universal";
  public readonly displayName = "Universal POS / Ingress";
  public readonly authType = "API_KEY" as const;

  public async testConnection(config: Record<string, any>): Promise<ConnectionTestResult> {
    if (!config?.apiKey) {
      return {
        success: false,
        message: "API key is required for universal ingress connection.",
      };
    }
    return {
      success: true,
      message: "Ingress webhook configuration valid and active.",
      discoveredEntities: ["transactions", "inventory"],
    };
  }

  public async discoverSchema(_config: Record<string, any>): Promise<SourceSchemaDefinition> {
    return {
      entities: [
        {
          entityName: "transactions",
          fields: [
            { name: "externalId", type: "string", nullable: false, isPrimaryKey: true },
            { name: "totalAmount", type: "number", nullable: false },
            { name: "subtotal", type: "number", nullable: true },
            { name: "tax", type: "number", nullable: true },
            { name: "discount", type: "number", nullable: true },
            { name: "currency", type: "string", nullable: true },
            { name: "transactionDate", type: "datetime", nullable: false },
            { name: "status", type: "string", nullable: true },
            { name: "customerRef", type: "string", nullable: true },
            { name: "storeLocation", type: "string", nullable: true },
          ],
        },
      ],
    };
  }

  public async pullIncremental(
    _config: Record<string, any>,
    entityName: string,
    cursor: SyncCursor | null
  ): Promise<IncrementalSyncBatch> {
    // Universal Ingress is push-driven via webhooks, so pull returns empty
    return {
      entityName,
      records: [],
      cursor: cursor || {},
      hasMore: false,
    };
  }
}
