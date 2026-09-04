import type { Request, Response } from "express";
import {
  getRegistrationOptions,
  verifyAndSaveRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
  listUserPasskeys,
  deletePasskey,
} from "../services/webauthnService";
import { verifyToken, generateToken } from "../utils/jwt";
import prisma from "../lib/prisma";

// --- Authenticated Management (Settings) ---

export async function getPasskeyRegistrationOptions(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    const options = await getRegistrationOptions(userId);
    res.json(options);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to generate registration options." });
  }
}

export async function verifyPasskeyRegistration(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { response, name } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    if (!response) {
      res.status(400).json({ message: "Missing WebAuthn registration response." });
      return;
    }

    const result = await verifyAndSaveRegistration(userId, response, name);
    res.json({ message: "Passkey registered successfully.", passkey: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to verify passkey registration." });
  }
}

export async function getUserPasskeys(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    const passkeys = await listUserPasskeys(userId);
    res.json({ passkeys });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch passkeys." });
  }
}

export async function removePasskey(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const passkeyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    if (!passkeyId) {
      res.status(400).json({ message: "Passkey ID is required." });
      return;
    }

    const result = await deletePasskey(userId, passkeyId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to delete passkey." });
  }
}
// --- Login 2FA Flow (Requires valid tempToken) ---

export async function getPasskeyLoginOptions(req: Request, res: Response): Promise<void> {
  try {
    const { tempToken } = req.body;
    if (!tempToken) {
      res.status(400).json({ message: "Temporary 2FA token is required." });
      return;
    }

    let payload: any;
    try {
      payload = verifyToken(tempToken);
    } catch {
      res.status(401).json({ message: "2FA session expired. Please sign in again." });
      return;
    }

    if (payload.stage !== "2FA_PENDING" || !payload.userId) {
      res.status(400).json({ message: "Invalid 2FA session state." });
      return;
    }

    const options = await getAuthenticationOptions(payload.userId);
    res.json(options);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to get authentication options." });
  }
}

export async function verifyPasskeyLogin(req: Request, res: Response): Promise<void> {
  try {
    const { tempToken, response } = req.body;
    if (!tempToken || !response) {
      res.status(400).json({ message: "tempToken and WebAuthn response are required." });
      return;
    }

    let payload: any;
    try {
      payload = verifyToken(tempToken);
    } catch {
      res.status(401).json({ message: "2FA session expired. Please sign in again." });
      return;
    }

    if (payload.stage !== "2FA_PENDING" || !payload.userId) {
      res.status(400).json({ message: "Invalid 2FA session state." });
      return;
    }

    await verifyAuthentication(payload.userId, response);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Reset lockouts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        action: "LOGIN_SUCCESS",
        details: "Completed 2FA via Passkey/WebAuthn.",
      },
    });

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        provider: user.provider,
        picture: user.picture,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Passkey authentication failed." });
  }
}



