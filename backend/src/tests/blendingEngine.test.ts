import { describe, it, expect } from "vitest";
import { BlendingEngine } from "../services/copilot/blendingEngine";
import { ToolRegistry } from "../services/copilot/toolRegistry";

describe("Phase 3.2 — Milestone 1: Blending Engine & Join Resolver Suite", () => {
  const customerRows = [
    { customerId: "C101", name: "Acme Corp", tier: "Enterprise" },
    { customerId: "C102", name: "Beta LLC", tier: "Growth" },
    { customerId: "C103", name: "Gamma Inc", tier: "Starter" },
  ];

  const transactionRows = [
    { txId: "TX1", customerId: "C101", amount: 1500, status: "PAID" },
    { txId: "TX2", customerId: "C101", amount: 2500, status: "PAID" },
    { txId: "TX3", customerId: "C102", amount: 800, status: "PENDING" },
    { txId: "TX4", customerId: "C999", amount: 300, status: "PAID" }, // Foreign key without customer
  ];

  it("1. Automatically detects join key between related tables", () => {
    const key = BlendingEngine.detectJoinKey(customerRows, transactionRows);
    expect(key).not.toBeNull();
    expect(key?.leftKey).toBe("customerId");
    expect(key?.rightKey).toBe("customerId");
  });

  it("2. Performs deterministic INNER_JOIN correctly", () => {
    const result = BlendingEngine.blend({
      leftDatasetId: "ds_cust",
      rightDatasetId: "ds_tx",
      leftRows: customerRows,
      rightRows: transactionRows,
      joinType: "INNER",
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.rowCount).toBe(3); // 2 for C101, 1 for C102
    expect(result.rows[0].name).toBe("Acme Corp");
    expect(result.rows[0].amount).toBe(1500);
    expect(result.rows[1].amount).toBe(2500);
  });

  it("3. Performs deterministic LEFT_JOIN preserving unmatched left rows", () => {
    const result = BlendingEngine.blend({
      leftDatasetId: "ds_cust",
      rightDatasetId: "ds_tx",
      leftRows: customerRows,
      rightRows: transactionRows,
      joinType: "LEFT",
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.rowCount).toBe(4); // 2 for C101, 1 for C102, 1 for C103 (null tx)
    const gammaRow = result.rows.find((r) => r.customerId === "C103");
    expect(gammaRow).toBeDefined();
    expect(gammaRow?.amount).toBeNull();
  });

  it("4. Disambiguates overlapping column names with prefixed aliasing", () => {
    const leftWithStatus = [
      { id: "1", status: "ACTIVE", value: 100 },
    ];
    const rightWithStatus = [
      { id: "1", status: "DELIVERED", cost: 50 },
    ];

    const result = BlendingEngine.blend({
      leftDatasetId: "ds_1",
      rightDatasetId: "ds_2",
      leftRows: leftWithStatus,
      rightRows: rightWithStatus,
      joinType: "INNER",
      condition: { leftKey: "id", rightKey: "id" },
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.rows[0].status).toBe("ACTIVE");
    expect(result.rows[0].right_status).toBe("DELIVERED");
    expect(result.disambiguatedColumns["status"]).toBe("right_status");
  });

  it("5. Executes blend_datasets tool via central ToolRegistry", async () => {
    const res = await ToolRegistry.executeTool(
      "blend_datasets",
      {
        userId: "test_user",
        datasetId: "ds_cust",
        rows: customerRows,
      },
      {
        rightDatasetId: "ds_tx",
        rightRows: transactionRows,
        joinType: "INNER",
      }
    );

    expect(res.status).toBe("SUCCESS");
    expect(res.rowCount).toBe(3);
  });
});


