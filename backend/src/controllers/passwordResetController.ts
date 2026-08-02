import { Request, Response } from "express";

import {
  requestPasswordReset,
  resetPassword as resetPasswordService,
} from "../services/passwordResetService";


export async function forgotPassword(
  req: Request,
  res: Response
) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    await requestPasswordReset(email);

    return res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Failed to process password reset request.",
    });
  }
}


export async function resetPassword(
  req: Request,
  res: Response
) {
  try {
    const {
      token,
      password,
    } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message:
          "Token and password are required.",
      });
    }

    await resetPasswordService(
      token,
      password
    );

    return res.json({
      message:
        "Password reset successfully.",
    });

  } catch (error) {
    console.error(error);

    return res.status(400).json({
      message:
        (error as Error).message,
    });
  }
}

