import { CopilotLogger } from "./copilotLogger";

export type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL" | "UNION";

export interface JoinCondition {
  leftKey: string;
  rightKey: string;
}

export interface BlendRequest {
  leftDatasetId: string;
  rightDatasetId: string;
  leftRows: Record<string, any>[];
  rightRows: Record<string, any>[];
  joinType: JoinType;
  condition?: JoinCondition;
  maxOutputRows?: number;
  correlationId?: string;
}

export interface BlendResult {
  status: "SUCCESS" | "NO_MATCHING_KEYS" | "LIMIT_EXCEEDED" | "INVALID_DATASET";
  joinType: JoinType;
  resolvedKey?: JoinCondition;
  rowCount: number;
  columnCount: number;
  columns: string[];
  rows: Record<string, any>[];
  disambiguatedColumns: Record<string, string>;
  durationMs: number;
}

export class BlendingEngine {
  private static readonly DEFAULT_MAX_ROWS = 50000;

  /**
   * Automatically detects common join keys between two row collections
   * based on matching column names and type compatibility.
   */
  public static detectJoinKey(
    leftRows: Record<string, any>[],
    rightRows: Record<string, any>[]
  ): JoinCondition | null {
    if (!leftRows.length || !rightRows.length) return null;

    const leftKeys = Object.keys(leftRows[0]);
    const rightKeys = Object.keys(rightRows[0]);

    // 1. Exact name match (case-insensitive)
    for (const lk of leftKeys) {
      const match = rightKeys.find(
        (rk) => rk.toLowerCase() === lk.toLowerCase()
      );
      if (match) {
        return { leftKey: lk, rightKey: match };
      }
    }

    // 2. Common ID pattern matching (e.g., id vs user_id / customer_id)
    for (const lk of leftKeys) {
      for (const rk of rightKeys) {
        const cleanLk = lk.toLowerCase().replace(/[_-]/g, "");
        const cleanRk = rk.toLowerCase().replace(/[_-]/g, "");
        if (cleanLk.includes(cleanRk) || cleanRk.includes(cleanLk)) {
          if (cleanLk.endsWith("id") || cleanRk.endsWith("id")) {
            return { leftKey: lk, rightKey: rk };
          }
        }
      }
    }

    return null;
  }

  /**
   * Deterministically executes an in-memory relational join or union across two datasets.
   */
  public static blend(req: BlendRequest): BlendResult {
    const startTime = Date.now();
    const maxRows = req.maxOutputRows || this.DEFAULT_MAX_ROWS;
    const disambiguatedColumns: Record<string, string> = {};

    if (req.joinType === "UNION") {
      const combined = [...req.leftRows, ...req.rightRows].slice(0, maxRows);
      const cols = Array.from(
        new Set(combined.flatMap((r) => Object.keys(r)))
      );
      const durationMs = Date.now() - startTime;

      return {
        status: "SUCCESS",
        joinType: "UNION",
        rowCount: combined.length,
        columnCount: cols.length,
        columns: cols,
        rows: combined,
        disambiguatedColumns: {},
        durationMs,
      };
    }

    // Resolve or detect join keys
    let condition = req.condition;
    if (!condition) {
      const detected = this.detectJoinKey(req.leftRows, req.rightRows);
      if (!detected) {
        return {
          status: "NO_MATCHING_KEYS",
          joinType: req.joinType,
          rowCount: 0,
          columnCount: 0,
          columns: [],
          rows: [],
          disambiguatedColumns: {},
          durationMs: Date.now() - startTime,
        };
      }
      condition = detected;
    }

    // Disambiguate overlapping column names (except the join keys)
    const leftCols = Object.keys(req.leftRows[0] || {});
    const rightCols = Object.keys(req.rightRows[0] || {});
    const commonCols = rightCols.filter(
      (rc) => rc !== condition!.rightKey && leftCols.includes(rc)
    );

    for (const col of commonCols) {
      disambiguatedColumns[col] = `right_${col}`;
    }

    // Build hash index on right dataset for O(N + M) join performance
    const rightIndex = new Map<string, Record<string, any>[]>();
    for (const rRow of req.rightRows) {
      const rawKey = rRow[condition.rightKey];
      if (rawKey === undefined || rawKey === null) continue;
      const keyStr = String(rawKey);
      if (!rightIndex.has(keyStr)) {
        rightIndex.set(keyStr, []);
      }
      rightIndex.get(keyStr)!.push(rRow);
    }

    const matchedRightKeys = new Set<string>();
    const resultRows: Record<string, any>[] = [];

    // Execute Left / Inner traversal
    for (const lRow of req.leftRows) {
      if (resultRows.length >= maxRows) break;

      const rawKey = lRow[condition.leftKey];
      const keyStr = rawKey !== undefined && rawKey !== null ? String(rawKey) : null;
      const matches = keyStr ? rightIndex.get(keyStr) : undefined;

      if (matches && matches.length > 0) {
        if (keyStr) matchedRightKeys.add(keyStr);
        for (const mRow of matches) {
          if (resultRows.length >= maxRows) break;
          const merged: Record<string, any> = { ...lRow };
          for (const [rCol, rVal] of Object.entries(mRow)) {
            if (rCol === condition.rightKey) continue;
            const targetCol = disambiguatedColumns[rCol] || rCol;
            merged[targetCol] = rVal;
          }
          resultRows.push(merged);
        }
      } else if (req.joinType === "LEFT" || req.joinType === "FULL") {
        const merged: Record<string, any> = { ...lRow };
        for (const rCol of rightCols) {
          if (rCol === condition.rightKey) continue;
          const targetCol = disambiguatedColumns[rCol] || rCol;
          merged[targetCol] = null;
        }
        resultRows.push(merged);
      }
    }

    // Full Outer join right-side completion
    if (req.joinType === "FULL" && resultRows.length < maxRows) {
      for (const rRow of req.rightRows) {
        if (resultRows.length >= maxRows) break;
        const rawKey = rRow[condition.rightKey];
        const keyStr = rawKey !== undefined && rawKey !== null ? String(rawKey) : null;
        if (!keyStr || !matchedRightKeys.has(keyStr)) {
          const merged: Record<string, any> = {};
          for (const lCol of leftCols) {
            merged[lCol] = null;
          }
          for (const [rCol, rVal] of Object.entries(rRow)) {
            const targetCol = disambiguatedColumns[rCol] || rCol;
            merged[targetCol] = rVal;
          }
          resultRows.push(merged);
        }
      }
    }

    const allColumns = Array.from(
      new Set(resultRows.flatMap((r) => Object.keys(r)))
    );
    const durationMs = Date.now() - startTime;

    if (req.correlationId) {
      CopilotLogger.log(
        "DETERMINISTIC_TOOL_EXECUTED",
        { correlationId: req.correlationId },
        {
          tool: "blend_datasets",
          joinType: req.joinType,
          inputRows: req.leftRows.length + req.rightRows.length,
          outputRows: resultRows.length,
        },
        durationMs
      );
    }

    return {
      status: "SUCCESS",
      joinType: req.joinType,
      resolvedKey: condition,
      rowCount: resultRows.length,
      columnCount: allColumns.length,
      columns: allColumns,
      rows: resultRows,
      disambiguatedColumns,
      durationMs,
    };
  }
}


