import { describe, it, expect } from "vitest";
import { VaultService } from "../services/integration/vaultService";
import { MockPosProvider } from "../services/integration/providers/mockPosProvider";
import { EntitlementService } from "../services/entitlementService";

describe("Phase 4.1 — Connector Foundation & Vault Security Suite", () => {
  it("1. Correctly encrypts and decrypts connection credentials via AES-256-GCM", () => {
    const rawCredentials = {
      apiKey: "pos_live_sec_998877665544332211",
      storeId: "store_nairobi_cbd_01",
      environment: "production",
    };

    const encrypted = VaultService.encrypt(rawCredentials);
    expect(encrypted).toBeTypeOf("string");
    expect(encrypted.split(":")).toHaveLength(3); // iv : authTag : ciphertext

    const decrypted = VaultService.decrypt<typeof rawCredentials>(encrypted);
    expect(decrypted.apiKey).toBe(rawCredentials.apiKey);
    expect(decrypted.storeId).toBe(rawCredentials.storeId);
    expect(decrypted.environment).toBe(rawCredentials.environment);
  });

  it("2. Fails cleanly when encrypted payload is tampered with or corrupted", () => {
    const valid = VaultService.encrypt({ secret: "uncompromised" });
    const parts = valid.split(":");
    // Tamper with ciphertext
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}aa`;

    expect(() => VaultService.decrypt(tampered)).toThrow();
  });

  it("3. Masks sensitive credentials to prevent log and telemetry leakage", () => {
    const masked = VaultService.maskCredentials({
      apiKey: "pos_live_sec_998877665544332211",
      shortPin: "1234",
    });

    expect(masked.apiKey).toBe("pos_...2211");
    expect(masked.shortPin).toBe("********");
  });

  it("4. Validates connector provider interface against mock POS adapter", async () => {
    const provider = new MockPosProvider();

    // Test rejection with invalid credentials
    const failedTest = await provider.testConnection({ apiKey: "invalid_key" });
    expect(failedTest.success).toBe(false);

    // Test success with valid credentials
    const successTest = await provider.testConnection({ apiKey: "valid_live_key" });
    expect(successTest.success).toBe(true);
    expect(successTest.discoveredEntities).toContain("transactions");

    // Discover schema
    const schema = await provider.discoverSchema({});
    expect(schema.entities).toHaveLength(2);
    expect(schema.entities[0].entityName).toBe("transactions");

    // Pull incremental batch
    const batch = await provider.pullIncremental({}, "transactions", null, 10);
    expect(batch.records.length).toBeGreaterThan(0);
    expect(batch.cursor.lastSyncTimestamp).toBeDefined();
  });

  it("5. Blocks connection creation when user is unauthenticated or on FREE tier without active plan", async () => {
    const unauthDecision = await EntitlementService.evaluateConnectorAccess("");
    expect(unauthDecision.allowed).toBe(false);
    expect(unauthDecision.statusCode).toBe(401);
    expect(unauthDecision.code).toBe("AUTH_REQUIRED");

    const freeDecision = await EntitlementService.evaluateConnectorAccess("mock_free_user_id");
    expect(freeDecision.allowed).toBe(false);
    expect(freeDecision.statusCode).toBe(403);
    expect(freeDecision.code).toBe("PLAN_NOT_ENTITLED");
  });
});

