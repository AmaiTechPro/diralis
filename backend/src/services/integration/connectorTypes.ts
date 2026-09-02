export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  discoveredEntities?: string[];
}

export interface SourceSchemaField {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
}

export interface SourceEntitySchema {
  entityName: string;
  fields: SourceSchemaField[];
}

export interface SourceSchemaDefinition {
  entities: SourceEntitySchema[];
}

export interface SyncCursor {
  lastSyncTimestamp?: string;
  lastExtractedId?: string;
  paginationToken?: string;
  [key: string]: any;
}

export interface IncrementalSyncBatch {
  entityName: string;
  records: Record<string, any>[];
  cursor: SyncCursor;
  hasMore: boolean;
}

export interface IConnectorProvider {
  readonly providerId: string;
  readonly displayName: string;
  readonly authType: "API_KEY" | "OAUTH2" | "BASIC" | "CONNECTION_STRING";

  testConnection(config: Record<string, any>): Promise<ConnectionTestResult>;
  discoverSchema(config: Record<string, any>): Promise<SourceSchemaDefinition>;
  pullIncremental(
    config: Record<string, any>,
    entityName: string,
    cursor: SyncCursor | null,
    limit?: number
  ): Promise<IncrementalSyncBatch>;
}


