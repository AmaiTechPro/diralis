import crypto from "crypto";
import * as otplib from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";

// Safe resolver across CommonJS, ES Module, and bundled environments
const authInstance: any =
  (otplib as any).authenticator ||
  (otplib as any).default?.authenticator ||
  (otplib as any).default ||
  otplib;

const APP_NAME = "Diralis Enterprise";

/**
 * Generates an RFC 6238 compliant otpauth URI directly to avoid module export discrepancies.
 */
function buildOtpAuthUrl(account: string, issuer: string, secret: string): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(account);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

export async function initiate2FASetup(userId: string, email: string) {
  // Generate a standard base32 secret (falls back to native crypto if module fails)
  let secret: string;
  if (typeof authInstance.generateSecret === "function") {
    secret = authInstance.generateSecret();
  } else {
    // Standard RFC base32 secret generator fallback
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const bytes = crypto.randomBytes(20);
    secret = "";
    for (let i = 0; i < bytes.length; i++) {
      secret += alphabet[bytes[i] % alphabet.length];
    }
  }

  const otpauth =
    typeof authInstance.keyuri === "function"
      ? authInstance.keyuri(email, APP_NAME, secret)
      : buildOtpAuthUrl(email, APP_NAME, secret);

  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  await (prisma.user as any).update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return {
    secret,
    qrCode: qrCodeDataUrl,
  };
}

export async function confirmAndEnable2FA(userId: string, token: string) {
  const user = await (prisma.user as any).findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user || !user.twoFactorSecret) {
    throw new Error("2FA setup has not been initiated.");
  }

  const isValid =
    typeof authInstance.verify === "function"
      ? authInstance.verify({ token, secret: user.twoFactorSecret })
      : authInstance.check?.(token, user.twoFactorSecret);

  if (!isValid) {
    throw new Error("Invalid verification code. Please check your authenticator app.");
  }

  const plainBackupCodes: string[] = [];
  const hashedBackupCodes: string[] = [];

  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    plainBackupCodes.push(code);
    hashedBackupCodes.push(await bcrypt.hash(code, 10));
  }

  await (prisma.user as any).update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      backupCodes: hashedBackupCodes,
    },
  });

  await prisma.securityEvent.create({
    data: {
      userId,
      action: "TWO_FACTOR_ENABLED" as any,
      details: "Two-factor authentication enabled successfully with backup codes generated.",
    },
  });

  return {
    backupCodes: plainBackupCodes,
  };
}

export async function disable2FA(userId: string, currentPassword: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.password) {
    throw new Error("User not found or using OAuth authentication.");
  }

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    throw new Error("Current password verification failed.");
  }

  await (prisma.user as any).update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
    },
  });

  await prisma.securityEvent.create({
    data: {
      userId,
      action: "TWO_FACTOR_DISABLED" as any,
      details: "Two-factor authentication was disabled by user request.",
    },
  });

  return { success: true };
}


