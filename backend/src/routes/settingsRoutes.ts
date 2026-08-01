import { Router } from "express";

import {
  getSettings,
  updateSettings,
  updateProfile,
  changePassword,
} from "../controllers/settingsController";

import { authenticate } from "../middleware/authMiddleware";


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



router.patch(
  "/profile",
  authenticate,
  updateProfile
);



router.put(
  "/password",
  authenticate,
  changePassword
);



export default router;
