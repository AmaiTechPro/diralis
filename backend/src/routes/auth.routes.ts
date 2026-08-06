import { Router } from "express";

import {
  register,
  login,
  googleLogin,
  verifyEmail,
  resendVerification,
} from "../controllers/authController";

import {
  forgotPassword,
  resetPassword,
} from "../controllers/passwordResetController";


const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleLogin);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password",
  resetPassword
);

router.post(
  "/verify-email",
  verifyEmail
);

router.post(
  "/resend-verification",
  resendVerification
);



export default router;


