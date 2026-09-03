import { Router } from "express";

import {
  reportController,
  generateReportPDF,
  generateSectionReportPDF,
} from "../controllers/reportController";

import { authenticate } from "../middleware/authMiddleware";
import { requireFeature } from "../middleware/entitlementMiddleware";

const router = Router();

router.get(
  "/",
  authenticate,
  reportController
);

router.get(
  "/generate",
  authenticate,
  requireFeature("reports"),
  generateReportPDF
);

router.get(
  "/generate/:section",
  authenticate,
  requireFeature("reports"),
  generateSectionReportPDF
);

export default router;


