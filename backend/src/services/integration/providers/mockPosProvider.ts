import {
  IConnectorProvider,
  ConnectionTestResult,
  SourceSchemaDefinition,
  IncrementalSyncBatch,
  SyncCursor,
} from "../connectorTypes";

export class MockPosProvider implements IConnectorProvider {
  public readonly providerId = "mock_pos";
  public readonly displayName = "Mock Point of Sale";
  public readonly authType = "API_KEY" as const;

  public async testConnection(config: Record<string, any>): Promise<ConnectionTestResult> {
    if (!config.apiKey || config.apiKey === "invalid_key") {
      return {
        success: false,
        message: "Authentication failed. Invalid POS API key.",
      };
    }

    return {
      success: true,
      message: "Successfully connected to POS instance.",
      latencyMs: 42,
      discoveredEntities: ["transactions", "inventory"],
    };
  }

  public async discoverSchema(_config: Record<string, any>): Promise<SourceSchemaDefinition> {
    return {
      entities: [
        {
          entityName: "transactions",
          fields: [
            { name: "id", type: "string", nullable: false, isPrimaryKey: true },
            { name: "created_at", type: "datetime", nullable: false },
            { name: "total_amount", type: "number", nullable: false },
            { name: "item_count", type: "number", nullable: false },
          ],
        },
        {
          entityName: "inventory",
          fields: [
            { name: "sku", type: "string", nullable: false, isPrimaryKey: true },
            { name: "current_stock", type: "number", nullable: false },
            { name: "unit_cost", type: "number", nullable: false },
          ],
        },
      ],
    };
  }

  public async pullIncremental(
    _config: Record<string, any>,
    entityName: string,
    cursor: SyncCursor | null,
    limit = 50
  ): Promise<IncrementalSyncBatch> {
    const lastTime = cursor?.lastSyncTimestamp ? new Date(cursor.lastSyncTimestamp).getTime() : 0;
    
    // Generate deterministic mock batch
    const records = Array.from({ length: Math.min(limit, 5) }).map((_, idx) => ({
      id: `tx_${lastTime}_${idx + 1}`,
      created_at: new Date(Date.now() - (5 - idx) * 60000).toISOString(),
      total_amount: (idx + 1) * 25.5,
      item_count: idx + 1,
    }));

    return {
      entityName,
      records,
      cursor: {
        lastSyncTimestamp: new Date().toISOString(),
        lastExtractedId: records[records.length - 1]?.id,
      },
      hasMore: false,
    };
  }
}


