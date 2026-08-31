import { Router } from "express";
import { overallInsightsController } from "../controllers/overallInsightsController";
import { authenticate } from "../middleware/authMiddleware";
import { requireFeature } from "../middleware/entitlementMiddleware";

const router = Router();

router.get(
  "/",
  authenticate,
  requireFeature("analytics"),
  overallInsightsController
);

export default router;


