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
import { logSecurityEvent } from "../utils/auditLogger";

// Helper to safely get user ID across different middleware implementations
function extractUserId(req: Request): string | null {
  const user = (req as any).user;
  return user?.userId || user?.id || null;
}

// --- Authenticated Management (Settings & Onboarding) ---

export async function getPasskeyRegistrationOptions(req: Request, res: Response): Promise<void> {
  try {
    const userId = extractUserId(req);
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
    const userId = extractUserId(req);
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

    await logSecurityEvent(req, {
      action: "WEBAUTHN_REGISTERED",
      userId,
      details: `Registered WebAuthn passkey: "${name || "Security Key"}"`,
      metadata: {
        passkeyId: result.id,
      },
    });

    res.json({ message: "Passkey registered successfully.", passkey: result });
  } catch (error: any) {
    await logSecurityEvent(req, {
      action: "FAILED_LOGIN",
      userId: extractUserId(req),
      details: `Failed passkey enrollment attempt: ${error.message || "Unknown error"}`,
    });

    res.status(400).json({ message: error.message || "Failed to verify passkey registration." });
  }
}

export async function getUserPasskeys(req: Request, res: Response): Promise<void> {
  try {
    const userId = extractUserId(req);
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
    const userId = extractUserId(req);
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

    await logSecurityEvent(req, {
      action: "WEBAUTHN_REVOKED",
      userId,
      details: `Revoked passkey identifier: ${passkeyId}`,
    });

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

    const targetUserId = payload.userId || payload.id;
    if (payload.stage !== "2FA_PENDING" || !targetUserId) {
      res.status(400).json({ message: "Invalid 2FA session state." });
      return;
    }

    const options = await getAuthenticationOptions(targetUserId);
    res.json(options);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to get authentication options." });
  }
}

export async function verifyPasskeyLogin(req: Request, res: Response): Promise<void> {
  let targetUserId: string | null = null;

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

    targetUserId = payload.userId || payload.id;
    if (payload.stage !== "2FA_PENDING" || !targetUserId) {
      res.status(400).json({ message: "Invalid 2FA session state." });
      return;
    }

    await verifyAuthentication(targetUserId, response);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    await logSecurityEvent(req, {
      action: "WEBAUTHN_AUTHENTICATED",
      userId: user.id,
      details: "Completed 2FA challenge via WebAuthn Passkey.",
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
    await logSecurityEvent(req, {
      action: "FAILED_LOGIN",
      userId: targetUserId,
      details: `Failed passkey authentication challenge: ${error.message || "Unknown error"}`,
    });

    res.status(400).json({ message: error.message || "Passkey authentication failed." });
  }
}





