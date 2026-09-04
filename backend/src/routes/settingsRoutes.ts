import { Router } from "express";
import {
  getSettings,
  updateSettings,
  updateProfile,
  changePassword,
  setup2FA,
  verify2FA,
  disable2FAHandler,
} from "../controllers/settingsController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, getSettings);
router.patch("/", authenticate, updateSettings);
router.patch("/profile", authenticate, updateProfile);
router.put("/password", authenticate, changePassword);

// 2FA Security Management
router.post("/2fa/setup", authenticate, setup2FA);
router.post("/2fa/verify", authenticate, verify2FA);
router.post("/2fa/disable", authenticate, disable2FAHandler);

export default router;


