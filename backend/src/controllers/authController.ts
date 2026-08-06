import { Request, Response } from "express";
import { loginWithGoogle, verifyGoogleToken } from "../services/googleAuthService";
import {
  registerUser,
  loginUser,
} from "../services/authService";

import {
  verifyEmailCode,
} from "../services/auth/emailVerificationService";



export async function register(
  req: Request,
  res: Response
) {
  try {
    const {
      fullName,
      username,
      email,
      password,
    } = req.body;

    const result = await registerUser(
      fullName,
      username,
      email,
      password
    );

    res.status(201).json({
  message:
    "Verification code sent to your email.",

  user: result.user,
});
  } catch (error) {
    res.status(400).json({
      error: (error as Error).message,
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const {
      identifier,
      password,
    } = req.body;

    const result = await loginUser(
      identifier,
      password
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({
      error: (error as Error).message,
    });
  }
}

export async function googleLogin(
  req: Request,
  res: Response
  )
 {
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


export async function verifyEmail(

  req: Request,

  res: Response

) {

  try {

    const {

      email,

      code,

    } = req.body;

    const result =
      await verifyEmailCode(

        email,

        code

      );

    res.json(result);

  } catch (error) {

    res.status(400).json({

      error:
        (error as Error).message,

    });

  }

}


