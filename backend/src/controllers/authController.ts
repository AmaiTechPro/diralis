import { Request, Response } from "express";
import { loginWithGoogle, verifyGoogleToken } from "../services/googleAuthService";
import {
  registerUser,
  loginUser,
  verify2FALogin,
} from "../services/authService";
import { verifyEmailCode } from "../services/auth/emailVerificationService";
import { resendVerificationCode } from "../services/auth/resendVerificationService";

export async function register(req: Request, res: Response) {
  try {
    const { fullName, username, email, password } = req.body;

    const result = await registerUser(
      fullName,
      username,
      email,
      password
    );

    res.status(201).json({
      message: "Verification code sent to your email.",
      user: result.user,
    });
  } catch (error) {
    res.status(400).json({
      error: (error as Error).message,
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { identifier, password } = req.body;

    const result = await loginUser(identifier, password);

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({
      error: (error as Error).message,
    });
  }
}

export async function verify2FAChallenge(req: Request, res: Response) {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({
        error: "Temporary token and verification code are required.",
      });
    }

    const result = await verify2FALogin(tempToken, code);

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({
      error: (error as Error).message,
    });
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: "Google credential is required.",
      });
    }

    const result = await loginWithGoogle(credential);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      error: (error as Error).message,
    });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { email, code } = req.body;

    const result = await verifyEmailCode(email, code);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: (error as Error).message,
    });
  }
}

export async function resendVerification(req: Request, res: Response) {
  try {
    const { email } = req.body;

    const result = await resendVerificationCode(email);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: (error as Error).message,
    });
  }
}


