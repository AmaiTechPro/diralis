import prisma from "../../lib/prisma";
import { VaultService } from "./vaultService";
import { MockPosProvider } from "./providers/mockPosProvider";
import { IConnectorProvider } from "./connectorTypes";

export class ConnectionService {
  private static providers: Map<string, IConnectorProvider> = new Map([
    ["mock_pos", new MockPosProvider()],
  ]);

  public static getProvider(providerId: string): IConnectorProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`PROVIDER_NOT_FOUND: Unknown provider '${providerId}'`);
    }
    return provider;
  }

  public static async createConnection(params: {
    userId: string;
    providerId: string;
    name: string;
    config: Record<string, any>;
    syncFrequency?: "MANUAL" | "HOURLY" | "DAILY" | "REALTIME";
  }) {
    const provider = this.getProvider(params.providerId);

    // Pre-flight connection verification
    const testResult = await provider.testConnection(params.config);
    if (!testResult.success) {
      throw new Error(`CONNECTION_TEST_FAILED: ${testResult.message}`);
    }

    const encryptedConfig = VaultService.encrypt(params.config);

    const connection = await prisma.integrationConnection.create({
      data: {
        userId: params.userId,
        providerId: params.providerId,
        name: params.name,
        encryptedConfig,
        syncFrequency: params.syncFrequency || "DAILY",
        status: "ACTIVE",
      },
    });

    return {
      id: connection.id,
      name: connection.name,
      providerId: connection.providerId,
      status: connection.status,
      syncFrequency: connection.syncFrequency,
      maskedConfig: VaultService.maskCredentials(params.config),
      createdAt: connection.createdAt,
    };
  }

  public static async listConnections(userId: string) {
    const connections = await prisma.integrationConnection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        providerId: true,
        status: true,
        syncFrequency: true,
        lastSyncAt: true,
        errorDetails: true,
        createdAt: true,
      },
    });

    return connections;
  }

  public static async deleteConnection(userId: string, connectionId: string) {
    const existing = await prisma.integrationConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!existing) {
      throw new Error("CONNECTION_NOT_FOUND: Resource does not exist or unauthorized.");
    }

    await prisma.integrationConnection.delete({
      where: { id: connectionId },
    });

    return { success: true };
  }
}


