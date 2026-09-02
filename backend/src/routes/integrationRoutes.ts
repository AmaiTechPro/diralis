import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  connectShopify,
  shopifyCallback,
  triggerManualSync,
  listConnections,
  deleteConnection,
} from "../controllers/integrationController";

const router = Router();

// Shopify OAuth connection flows
router.get("/shopify/connect", authenticate, connectShopify);
router.get("/shopify/callback", authenticate, shopifyCallback);

// Connection operations
router.get("/", authenticate, listConnections);
router.post("/:connectionId/sync", authenticate, triggerManualSync);
router.delete("/:connectionId", authenticate, deleteConnection);

export default router;


