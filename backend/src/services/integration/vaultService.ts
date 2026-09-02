import crypto from "crypto";

export interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

export class VaultService {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly IV_LENGTH = 12; // 96-bit IV recommended for GCM

  private static getEncryptionKey(): Buffer {
    const rawKey = process.env.INTEGRATION_ENCRYPTION_KEY || process.env.JWT_SECRET || "default_insecure_key_must_be_32_bytes!!";
    // Derive exactly 32 bytes (256 bits) using SHA-256
    return crypto.createHash("sha256").update(rawKey).digest();
  }

  /**
   * Encrypts plain configuration/credentials into a structured serialized string: iv:authTag:ciphertext
   */
  public static encrypt(data: Record<string, any>): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    const plaintext = JSON.stringify(data);
    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${ciphertext}`;
  }

  /**
   * Decrypts and authenticates serialized credentials.
   * Throws if corrupted or tampered with.
   */
  public static decrypt<T = Record<string, any>>(serialized: string): T {
    const parts = serialized.split(":");
    if (parts.length !== 3) {
      throw new Error("INVALID_ENCRYPTED_FORMAT: Expected iv:authTag:ciphertext");
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = this.getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted) as T;
  }

  /**
   * Masks sensitive fields to guarantee credentials never leak into logs or UI.
   */
  public static maskCredentials(config: Record<string, any>): Record<string, string> {
    const masked: Record<string, string> = {};
    for (const [key, val] of Object.entries(config)) {
      const strVal = String(val);
      if (strVal.length <= 8) {
        masked[key] = "********";
      } else {
        masked[key] = `${strVal.slice(0, 4)}...${strVal.slice(-4)}`;
      }
    }
    return masked;
  }
}


