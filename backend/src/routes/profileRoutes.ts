import { Router } from "express";
import { getDatasetProfile } from "../controllers/profileController";
import { authenticate } from "../middleware/authMiddleware";
import { requireFeature } from "../middleware/entitlementMiddleware";

const router = Router();

// Route is mounted under router.use("/", profileRoutes) or router.use("/datasets", profileRoutes)
// Using "/:id/profile" allows mounting under "/datasets"
router.get(
  "/:id/profile",
  authenticate,
  requireFeature("analytics"),
  getDatasetProfile
);

export default router;


