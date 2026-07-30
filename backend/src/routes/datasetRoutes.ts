import { Router } from "express";

import { upload } from "../middleware/uploadMiddleware";
import { authenticate } from "../middleware/authMiddleware";

import {
  uploadDataset,
  getDatasets,
  deleteDataset,
  previewDatasetController,
} from "../controllers/datasetController";

const router = Router();

// All dataset routes require authentication
router.use(authenticate);

router.get("/", getDatasets);

router.post(
  "/upload",
  upload.single("dataset"),
  uploadDataset
);

router.get(
  "/:id/preview",
  previewDatasetController
);

router.delete(
  "/:id",
  deleteDataset
);

export default router;

