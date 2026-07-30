import { Router } from "express";

import {
  getDatasetProfile,
} from "../controllers/profileController";

const router = Router();

router.get(
  "/datasets/:id/profile",
  getDatasetProfile
);

export default router;

