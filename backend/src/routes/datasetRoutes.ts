import { Router } from "express";

import { upload } from "../middleware/uploadMiddleware";

import {
  uploadDataset,
  getDatasets,
  deleteDataset,
  previewDatasetController,
} from "../controllers/datasetController";

const router = Router();

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

