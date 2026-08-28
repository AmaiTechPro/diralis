import { Router } from "express";

import { getDatasetProfile } from "../controllers/profileController";
import { authenticate } from "../middleware/authMiddleware";
import { requireFeature } from "../middleware/entitlementMiddleware";

const router = Router();

router.get(
  "/datasets/:id/profile",
  authenticate,
  requireFeature("analytics"),
  getDatasetProfile
);

export default router;

