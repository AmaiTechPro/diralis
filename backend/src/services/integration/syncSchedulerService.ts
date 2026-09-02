import prisma from "../../lib/prisma";
import { SyncOrchestratorService, OrchestrationResult } from "./syncOrchestratorService";
import { CopilotLogger } from "../copilot/copilotLogger";
import { IntegrationStatus, SyncFrequency } from "@prisma/client";

export class SyncSchedulerService {
  private static timer: NodeJS.Timeout | null = null;
  private static isTickRunning = false;
  public static defaultLimit = 10;
  public static maxWorkerConcurrency = 3;

  /**
   * Queries due connections across all tenants.
   */
  public static async discoverDueConnections(limit: number = this.defaultLimit) {
    const now = new Date();

    return prisma.integrationConnection.findMany({
      where: {
        status: IntegrationStatus.ACTIVE,
        syncFrequency: { not: SyncFrequency.MANUAL },
        AND: [
          {
            OR: [
              { nextSyncAt: null },
              { nextSyncAt: { lte: now } },
            ],
          },
          {
            OR: [
              { syncInProgress: false },
              { syncLeaseExpiresAt: { lt: now } },
            ],
          },
        ],
      },
      take: limit,
      orderBy: { nextSyncAt: "asc" },
    });
  }

  /**
   * Executes one tick of the background scheduler with bounded concurrency.
   */
  public static async executeSchedulerTick(): Promise<OrchestrationResult[]> {
    if (this.isTickRunning) {
      return [];
    }

    this.isTickRunning = true;
    const results: OrchestrationResult[] = [];

    try {
      // 1. Stale lease recovery
      await SyncOrchestratorService.recoverStaleLeases();

      // 2. Discover due connections
      const dueConnections = await this.discoverDueConnections();

      // 3. Process with bounded concurrency
      const chunks: typeof dueConnections[] = [];
      for (let i = 0; i < dueConnections.length; i += this.maxWorkerConcurrency) {
        chunks.push(dueConnections.slice(i, i + this.maxWorkerConcurrency));
      }

      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map((conn) =>
            SyncOrchestratorService.orchestrateSync({
              connectionId: conn.id,
              userId: conn.userId,
            })
          )
        );
        results.push(...chunkResults);
      }
    } catch (err: any) {
      CopilotLogger.log(
        "DETERMINISTIC_TOOL_EXECUTED",
        {},
        { error: err.message, action: "SCHEDULER_TICK_ERROR" },
        undefined,
        "ERROR"
      );
    } finally {
      this.isTickRunning = false;
    }

    return results;
  }

  /**
   * Starts periodic polling loop.
   */
  public static start(intervalMs: number = 60 * 1000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.executeSchedulerTick().catch((err) => {
        console.error("Scheduler tick error:", err);
      });
    }, intervalMs);
  }

  /**
   * Stops periodic polling loop.
   */
  public static stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}


