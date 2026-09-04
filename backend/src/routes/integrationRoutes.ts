import { handleShopifyWebhook } from "../controllers/shopifyWebhookController";
import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  connectShopify,
  shopifyCallback,
  triggerManualSync,
  listConnections,
  deleteConnection,
  listConnectionsFreshness,
  getConnectionFreshness,
  createConnection,
  handleUniversalIngress,
  provisionUniversalConnection,
} from "../controllers/integrationController";

const router = Router();

// Universal Ingress Endpoint (Authenticated via x-diralis-key in header)
router.post("/ingest/:connectionId", handleUniversalIngress);

// Freshness endpoints (must precede /:connectionId routes to avoid wildcard collision)
router.get("/freshness", authenticate, listConnectionsFreshness);
router.get("/:connectionId/freshness", authenticate, getConnectionFreshness);

// Shopify OAuth connection flows
router.get("/shopify/connect", authenticate, connectShopify);
router.get("/shopify/callback", shopifyCallback);
router.post("/shopify/webhooks", handleShopifyWebhook);

// Universal Connection provisioning
router.post("/universal/provision", authenticate, provisionUniversalConnection);

// Generic Connection operations
router.get("/", authenticate, listConnections);
router.post("/", authenticate, createConnection);
router.post("/:connectionId/sync", authenticate, triggerManualSync);
router.delete("/:connectionId", authenticate, deleteConnection);

export default router;
