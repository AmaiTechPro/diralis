import { Router } from "express";

import {
  reportController,
  generateReportPDF,
  generateSectionReportPDF,
} from "../controllers/reportController";


const router = Router();


router.get(
  "/",
  reportController
);


router.get(
  "/generate",
  generateReportPDF
);


router.get(
  "/generate/:section",
  generateSectionReportPDF
);


export default router;

