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

import {
  setup2FA,
  verify2FA, // or confirm2FA / whatever matches the export in settingsController
} from "../controllers/settingsController";

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


// --- Passkey Management ---
router.get("/passkeys/register-options", authMiddleware, getPasskeyRegistrationOptions);
router.post("/passkeys/register-options", authMiddleware, getPasskeyRegistrationOptions);
router.post("/passkeys/verify-registration", authMiddleware, verifyPasskeyRegistration);
router.get("/passkeys", authMiddleware, getUserPasskeys);
router.delete("/passkeys/:id", authMiddleware, removePasskey);

// --- 2FA / TOTP Management ---
router.post("/2fa/setup", authMiddleware, setup2FA);
router.post("/2fa/verify", authMiddleware, verify2FA);

// Support both route paths for passkey registration verification
router.post("/passkeys/register-verify", authMiddleware, verifyPasskeyRegistration);
router.post("/passkeys/verify-registration", authMiddleware, verifyPasskeyRegistration);


export default router;