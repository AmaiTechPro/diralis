import { Request, Response } from "express";
import { loginWithGoogle, verifyGoogleToken } from "../services/googleAuthService";
import {
  registerUser,
  loginUser,
  verify2FALogin,
} from "../services/authService";
import { verifyEmailCode } from "../services/auth/emailVerificationService";
import { resendVerificationCode } from "../services/auth/resendVerificationService";
import { logSecurityEvent } from "../utils/auditLogger";
import { generateToken } from "../utils/jwt";

export async function register(req: Request, res: Response) {
  try {
    const { fullName, username, email, password } = req.body;

    const result = await registerUser(
      fullName,
      username,
      email,
      password
    );

    if (!result.user) {
      res.status(400).json({ error: "Failed to create user account." });
      return;
    }

    // Safe generation with verified result.user
    const token = generateToken(result.user.id, result.user.role);

    await logSecurityEvent(req, {
      action: "USER_CREATED",
      userId: result.user.id,
      details: `New account created for email: ${email}`,
    });

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: result.user,
    });
  } catch (error) {
    await logSecurityEvent(req, {
      action: "FAILED_LOGIN",
      details: `Failed registration attempt for email: ${req.body?.email || "unknown"} - ${(error as Error).message}`,
    });

    res.status(400).json({
      error: (error as Error).message,
    });
  }
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body;

  try {
    const result = await loginUser(identifier, password);

    if (result.requires2FA) {
      await logSecurityEvent(req, {
        action: "LOGIN_SUCCESS",
        userId: result.user?.id || null,
        details: "Primary password verified; awaiting 2FA challenge completion.",
      });
    } else {
      await logSecurityEvent(req, {
        action: "LOGIN_SUCCESS",
        userId: result.user?.id || null,
        details: "Password authentication successful.",
      });
    }

    res.status(200).json(result);
  } catch (error) {
    await logSecurityEvent(req, {
      action: "FAILED_LOGIN",
      details: `Failed login attempt for identifier: ${identifier || "unknown"} - ${(error as Error).message}`,
    });

    res.status(401).json({
      error: (error as Error).message,
    });
  }
}

export async function verify2FAChallenge(req: Request, res: Response) {
  const { tempToken, code } = req.body;

  try {
    if (!tempToken || !code) {
      return res.status(400).json({
        error: "Temporary token and verification code are required.",
      });
    }

    const result = await verify2FALogin(tempToken, code);

    await logSecurityEvent(req, {
      action: "TWO_FACTOR_VERIFIED",
      userId: result.user?.id || null,
      details: "Completed 2FA challenge via authenticator or backup code.",
    });

    res.status(200).json(result);
  } catch (error) {
    await logSecurityEvent(req, {
      action: "FAILED_LOGIN",
      details: `Failed 2FA challenge attempt - ${(error as Error).message}`,
    });

    res.status(401).json({
      error: (error as Error).message,
    });
  }
}

export async function googleLogin(req: Request, res: Response) {
  const { credential } = req.body;

  try {
    if (!credential) {
      return res.status(400).json({
        error: "Google credential is required.",
      });
    }

    const result = await loginWithGoogle(credential);

    await logSecurityEvent(req, {
      action: "GOOGLE_LOGIN",
      userId: result.user?.id || null,
      details: "Authenticated via Google SSO.",
    });

    res.json(result);
  } catch (error) {
    await logSecurityEvent(req, {
      action: "FAILED_LOGIN",
      details: `Failed Google SSO authentication - ${(error as Error).message}`,
    });

    res.status(401).json({
      error: (error as Error).message,
    });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  const { email, code } = req.body;

  try {
    const result = await verifyEmailCode(email, code);

    await logSecurityEvent(req, {
      action: "EMAIL_VERIFIED",
      userId: (result as any)?.user?.id || null,
      details: `Email address successfully verified: ${email}`,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: (error as Error).message,
    });
  }
}

export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body;

  try {
    const result = await resendVerificationCode(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: (error as Error).message,
    });
  }
}


