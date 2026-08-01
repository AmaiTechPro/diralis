import { Router } from "express";

import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController";

import {
  authenticate,
} from "../middleware/authMiddleware";


const router = Router();



router.get(
  "/",
  authenticate,
  getSettings
);



router.patch(
  "/",
  authenticate,
  updateSettings
);



export default router;

