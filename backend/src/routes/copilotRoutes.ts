import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { requireEntitlement } from "../middleware/entitlementMiddleware";
import { getInsightsFeed, dismissInsight } from "../controllers/copilotController";

const router = Router();

router.get(
  "/feed/:datasetId",
  authenticate,
  requireEntitlement({ datasetIdParam: "datasetId" }),
  getInsightsFeed
);

router.post("/feed/:insightId/dismiss", authenticate, dismissInsight);

export default router;

