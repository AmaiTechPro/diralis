import { Router } from "express";
import {
  register,
  login,
  googleLogin,
  verifyEmail,
  resendVerification,
  verify2FAChallenge,
} from "../controllers/authController";
import {
  getPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  getUserPasskeys,
  removePasskey,
  getPasskeyLoginOptions,
  verifyPasskeyLogin,
} from "../controllers/webauthnController";
import { authenticate as authMiddleware } from "../middleware/authMiddleware";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Core Auth Routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/verify-2fa", verify2FAChallenge);

// Passkey WebAuthn Authentication (Login Flow)
router.post("/passkeys/login-options", getPasskeyLoginOptions);
router.post("/passkeys/verify-login", verifyPasskeyLogin);

// Passkey WebAuthn Management (Authenticated Session / Onboarding)
router.get("/passkeys/register-options", authMiddleware, getPasskeyRegistrationOptions);
router.post("/passkeys/verify-registration", authMiddleware, verifyPasskeyRegistration);
router.get("/passkeys", authMiddleware, getUserPasskeys);
router.delete("/passkeys/:id", authMiddleware, removePasskey);

export default router;