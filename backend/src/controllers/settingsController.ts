import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { isPasswordReused, recordPasswordHistory } from "../services/passwordHistoryService";
import { initiate2FASetup, confirmAndEnable2FA, disable2FA } from "../services/twoFactorService";

export async function getSettings(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        theme: true,
        emailNotifications: true,
        twoFactorEnabled: true,
        twoFactorSecret: true, // Fetch the secret to verify TOTP status
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only report 2FA as active if both the flag is true AND the secret exists
    const hasTotpConfigured = Boolean(user.twoFactorEnabled && user.twoFactorSecret);

    return res.json({
      theme: user.theme,
      emailNotifications: user.emailNotifications,
      twoFactorEnabled: hasTotpConfigured, 
    });
  } catch (error) {
    console.error("[getSettings] Error:", error);
    return res.status(500).json({ message: "Failed to load settings" });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { theme, emailNotifications } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(theme !== undefined && { theme }),
        ...(emailNotifications !== undefined && { emailNotifications }),
      },
      select: {
        theme: true,
        emailNotifications: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("[updateSettings] Error:", error);
    return res.status(500).json({ message: "Failed to update settings" });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { fullName, email } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email }),
      },
      select: {
        fullName: true,
        email: true,
        username: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Password change unavailable for accounts authenticated via OAuth providers.",
      });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    const isCurrentReused = await bcrypt.compare(newPassword, user.password);
    if (isCurrentReused) {
      return res.status(400).json({
        message: "New password cannot be identical to your current password.",
      });
    }

    const reusedInHistory = await isPasswordReused(userId, newPassword);
    if (reusedInHistory) {
      return res.status(400).json({
        message: "Security policy violation: You cannot reuse any of your last 5 passwords.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await recordPasswordHistory(userId, hashedPassword);

    await prisma.securityEvent.create({
      data: {
        userId,
        action: "PASSWORD_CHANGED" as any,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers["user-agent"] || null,
        details: "User password changed successfully with history retention enforcement.",
      },
    });

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("[changePassword] Error:", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
}

export async function setup2FA(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "Two-factor authentication is already enabled." });
    }

    const setupData = await initiate2FASetup(userId, user.email);
    return res.json(setupData);
  } catch (error) {
    console.error("[setup2FA] Error:", error);
    return res.status(500).json({ message: "Failed to initiate 2FA setup" });
  }
}

export async function verify2FA(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    const result = await confirmAndEnable2FA(userId, token);
    return res.json({
      message: "Two-factor authentication enabled successfully",
      backupCodes: result.backupCodes,
    });
  } catch (error) {
    console.error("[verify2FA] Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to verify 2FA token";
    return res.status(400).json({ message: msg });
  }
}

export async function disable2FAHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Current password is required to disable 2FA" });
    }

    await disable2FA(userId, password);
    return res.json({ message: "Two-factor authentication disabled successfully" });
  } catch (error) {
    console.error("[disable2FAHandler] Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to disable 2FA";
    return res.status(400).json({ message: msg });
  }
}