
{/*

import { Router } from "express";

import {
  reportController,
  generateReportPDF,
  generateSectionReportPDF,
} from "../controllers/reportController";

import { authenticate } from "../middleware/authMiddleware";


const router = Router();



router.get(
  "/",
  authenticate,
  reportController
);



router.get(
  "/generate",
  authenticate,
  generateReportPDF
);



router.get(
  "/generate/:section",
  authenticate,
  generateSectionReportPDF
);



export default router;

*/}

  {/* NEW REPORTROUTES! */}


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
  requireFeature("pdfExport"),
  generateReportPDF
);

router.get(
  "/generate/:section",
  authenticate,
  requireFeature("pdfExport"),
  generateSectionReportPDF
);

export default router;


