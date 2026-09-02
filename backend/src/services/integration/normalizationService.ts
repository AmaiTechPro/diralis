export interface NormalizationResult<T> {
  accepted: T[];
  rejected: Array<{
    rawRecord: Record<string, any>;
    reason: string;
    field?: string;
  }>;
}

export interface ValidatedTransaction {
  externalId: string;
  sourceEntity: string;
  transactionDate: Date;
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: string;
  customerRef?: string;
  storeLocation?: string;
  sourceMetadata?: Record<string, any>;
}

export interface ValidatedInventoryItem {
  externalId: string;
  sourceEntity: string;
  sku: string;
  productName: string;
  category?: string;
  currentStock: number;
  availableStock?: number;
  reservedStock?: number;
  reorderThreshold?: number;
  unitCost?: number;
  inventoryValue?: number;
  storeLocation?: string;
  effectiveDate: Date;
  sourceMetadata?: Record<string, any>;
}

export class NormalizationService {
  /**
   * Applies schema mappings to raw source records.
   */
  public static applyFieldMapping(
    rawRecord: Record<string, any>,
    mapping: Record<string, string>
  ): Record<string, any> {
    const mapped: Record<string, any> = {};

    for (const [sourceKey, targetKey] of Object.entries(mapping)) {
      if (rawRecord[sourceKey] !== undefined) {
        mapped[targetKey] = rawRecord[sourceKey];
      }
    }

    // Preserve unmapped attributes in a separate bucket for sourceMetadata if helpful
    return mapped;
  }

  /**
   * Deterministic safe number coercion.
   * Throws if input cannot be represented as a valid finite number.
   */
  public static coerceNumber(val: any, fieldName: string, defaultValue?: number): number {
    if (val === null || val === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`MISSING_NUMERIC_FIELD: ${fieldName} is required`);
    }

    if (typeof val === "number") {
      if (Number.isNaN(val) || !Number.isFinite(val)) {
        throw new Error(`INVALID_NUMERIC_VALUE: ${fieldName} is NaN or non-finite`);
      }
      return val;
    }

    if (typeof val === "string") {
      const cleaned = val.replace(/,/g, "").trim();
      const parsed = parseFloat(cleaned);
      if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
        throw new Error(`INVALID_NUMERIC_VALUE: Could not parse '${val}' for ${fieldName}`);
      }
      return parsed;
    }

    throw new Error(`INVALID_NUMERIC_TYPE: ${fieldName} must be a number or numeric string`);
  }

  /**
   * Deterministic safe date coercion.
   */
  public static coerceDate(val: any, fieldName: string): Date {
    if (!val) {
      throw new Error(`MISSING_DATE_FIELD: ${fieldName} is required`);
    }

    const d = new Date(val);
    if (Number.isNaN(d.getTime())) {
      throw new Error(`INVALID_DATE_VALUE: Could not parse '${val}' for ${fieldName}`);
    }
    return d;
  }

  /**
   * Normalizes and validates transaction records.
   */
  public static normalizeTransactions(
    rawRecords: Record<string, any>[],
    mapping: Record<string, string>
  ): NormalizationResult<ValidatedTransaction> {
    const accepted: ValidatedTransaction[] = [];
    const rejected: NormalizationResult<ValidatedTransaction>["rejected"] = [];

    for (const raw of rawRecords) {
      try {
        const mapped = this.applyFieldMapping(raw, mapping);

        const externalId = String(mapped.externalId || raw.id || raw.externalId || "").trim();
        if (!externalId) {
          throw new Error("MISSING_REQUIRED_FIELD: externalId is required");
        }

        const transactionDate = this.coerceDate(
          mapped.transactionDate || raw.created_at || raw.transactionDate || raw.timestamp,
          "transactionDate"
        );

        const totalAmount = this.coerceNumber(
          mapped.totalAmount ?? raw.total_amount ?? raw.total ?? raw.totalAmount,
          "totalAmount"
        );

        const subtotal = this.coerceNumber(
          mapped.subtotal ?? raw.subtotal ?? totalAmount,
          "subtotal",
          totalAmount
        );

        const tax = this.coerceNumber(mapped.tax ?? raw.tax, "tax", 0);
        const discount = this.coerceNumber(mapped.discount ?? raw.discount, "discount", 0);

        accepted.push({
          externalId,
          sourceEntity: "transactions",
          transactionDate,
          currency: String(mapped.currency || raw.currency || "USD").toUpperCase(),
          subtotal,
          tax,
          discount,
          totalAmount,
          status: String(mapped.status || raw.status || "COMPLETED").toUpperCase(),
          customerRef: mapped.customerRef ? String(mapped.customerRef) : undefined,
          storeLocation: mapped.storeLocation ? String(mapped.storeLocation) : undefined,
          sourceMetadata: { originalKeys: Object.keys(raw) },
        });
      } catch (err: any) {
        rejected.push({
          rawRecord: raw,
          reason: err.message || "NORMALIZATION_ERROR",
        });
      }
    }

    return { accepted, rejected };
  }

  /**
   * Normalizes and validates inventory items.
   */
  public static normalizeInventory(
    rawRecords: Record<string, any>[],
    mapping: Record<string, string>
  ): NormalizationResult<ValidatedInventoryItem> {
    const accepted: ValidatedInventoryItem[] = [];
    const rejected: NormalizationResult<ValidatedInventoryItem>["rejected"] = [];

    for (const raw of rawRecords) {
      try {
        const mapped = this.applyFieldMapping(raw, mapping);

        const externalId = String(
  mapped.externalId || mapped.sku || raw.id || raw.sku || raw.item_code || ""
).trim();
        if (!externalId) {
          throw new Error("MISSING_REQUIRED_FIELD: externalId is required");
        }

        const sku = String(mapped.sku || raw.sku || externalId).trim();
        const productName = String(mapped.productName || raw.name || raw.product_name || raw.productName || sku).trim();

        const currentStock = this.coerceNumber(
          mapped.currentStock ?? raw.current_stock ?? raw.quantity ?? raw.stock,
          "currentStock"
        );

        const unitCost = mapped.unitCost !== undefined || raw.unit_cost !== undefined
          ? this.coerceNumber(mapped.unitCost ?? raw.unit_cost, "unitCost")
          : undefined;

        const effectiveDate = (mapped.effectiveDate || raw.updated_at || raw.timestamp)
          ? this.coerceDate(mapped.effectiveDate || raw.updated_at || raw.timestamp, "effectiveDate")
          : new Date();

        accepted.push({
          externalId,
          sourceEntity: "inventory",
          sku,
          productName,
          category: mapped.category ? String(mapped.category) : undefined,
          currentStock,
          availableStock: mapped.availableStock !== undefined ? this.coerceNumber(mapped.availableStock, "availableStock") : undefined,
          reservedStock: mapped.reservedStock !== undefined ? this.coerceNumber(mapped.reservedStock, "reservedStock") : undefined,
          reorderThreshold: mapped.reorderThreshold !== undefined ? this.coerceNumber(mapped.reorderThreshold, "reorderThreshold") : undefined,
          unitCost,
          inventoryValue: unitCost !== undefined ? unitCost * currentStock : undefined,
          storeLocation: mapped.storeLocation ? String(mapped.storeLocation) : undefined,
          effectiveDate,
          sourceMetadata: { originalKeys: Object.keys(raw) },
        });
      } catch (err: any) {
        rejected.push({
          rawRecord: raw,
          reason: err.message || "NORMALIZATION_ERROR",
        });
      }
    }

    return { accepted, rejected };
  }
}


