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

