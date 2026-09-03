import prisma from "../../../../lib/prisma";
import { IngestionPipeline } from "../../ingestionPipeline";
import { WebhookEventStatus } from "@prisma/client";

export class ShopifyWebhookProcessor {
  /**
   * Processes a queued or received webhook event asynchronously.
   */
  public static async processEvent(eventId: string): Promise<void> {
    const event = await prisma.integrationEvent.findUnique({
      where: { id: eventId },
      include: { connection: true },
    });

    if (!event || event.status === WebhookEventStatus.PROCESSED) {
      return;
    }

    // Set state to PROCESSING
    await prisma.integrationEvent.update({
      where: { id: eventId },
      data: { status: WebhookEventStatus.PROCESSING },
    });

    try {
      const connection = event.connection;
      if (!connection || connection.status !== "ACTIVE") {
        throw new Error(`CONNECTION_INACTIVE: Connection ${event.connectionId} is not active.`);
      }

      // Route based on webhook topic
      switch (event.topic) {
        case "orders/create":
        case "orders/updated":
        case "orders/paid":
        case "orders/cancelled": {
          // Authoritative refetch: pull latest orders incrementally
          await IngestionPipeline.executeSync({
            userId: event.tenantId,
            connectionId: connection.id,
            entityName: "transactions",
          });
          break;
        }

        case "inventory_levels/update": {
          // Authoritative refetch: pull latest inventory levels incrementally
          await IngestionPipeline.executeSync({
            userId: event.tenantId,
            connectionId: connection.id,
            entityName: "inventory",
          });
          break;
        }

        default:
          console.warn(`[ShopifyWebhook] Unhandled topic: ${event.topic}`);
          break;
      }

      // Mark event PROCESSED
      await prisma.integrationEvent.update({
        where: { id: eventId },
        data: {
          status: WebhookEventStatus.PROCESSED,
          processedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error(`[ShopifyWebhookProcessor] Error processing event ${eventId}:`, error);
      await prisma.integrationEvent.update({
        where: { id: eventId },
        data: {
          status: WebhookEventStatus.FAILED,
          errorMessage: error.message || "Unknown error during event processing",
        },
      });
    }
  }
}