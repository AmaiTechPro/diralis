import { Router } from "express";

import {
  register,
  login,
  verify2FAChallenge,
  googleLogin,
  verifyEmail,
  resendVerification,
} from "../controllers/authController";

import {
  forgotPassword,
  resetPassword,
} from "../controllers/passwordResetController";

import {
  getPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  getUserPasskeys,
  removePasskey,
  getPasskeyLoginOptions,
  verifyPasskeyLogin,
} from "../controllers/webauthnController";

import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Standard Auth
router.post("/register", register);
router.post("/login", login);
router.post("/login/2fa", verify2FAChallenge);
router.post("/google", googleLogin);

// Passkey 2FA Login (Pre-authenticated using tempToken)
router.post("/login/passkey/options", getPasskeyLoginOptions);
router.post("/login/passkey/verify", verifyPasskeyLogin);

// Passkey Management (Authenticated Session Required)
router.get("/passkeys", authenticate, getUserPasskeys);
router.post("/passkeys/register-options", authenticate, getPasskeyRegistrationOptions);
router.post("/passkeys/register-verify", authenticate, verifyPasskeyRegistration);
router.delete("/passkeys/:id", authenticate, removePasskey);

// Password Reset & Verification
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

export default router;


