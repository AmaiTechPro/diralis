import crypto from "crypto";
import bcrypt from "bcrypt";
import * as otplib from "otplib";
import prisma from "../lib/prisma";
import { generateToken, generate2FATempToken, verifyToken } from "../utils/jwt";
import { sendVerificationEmail } from "./emailService";

type AuthResponse = {
  message?: string;
  user?: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    provider: string;
    picture: string | null;
    role: string;
    status: string;
    createdAt: Date;
  };
  token?: string;
  requires2FA?: boolean;
  tempToken?: string;
};

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function validatePassword(password: string) {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  if (!passwordRegex.test(password)) {
    throw new Error(
      "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character."
    );
  }
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerUser(
  fullName: string,
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new Error("Email already registered.");
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    throw new Error("Username already taken.");
  }
  validatePassword(password);

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const verificationCode = generateVerificationCode();

  const codeHash = crypto
    .createHash("sha256")
    .update(verificationCode)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      fullName,
      username,
      email,
      password: hashedPassword,
      provider: "local",
      emailVerified: false,
      emailVerifications: {
        create: {
          codeHash,
          expiresAt,
        },
      },
    },
  });

  await sendVerificationEmail(
    user.email,
    user.fullName,
    verificationCode
  );

  return {
    message: "Verification code sent to your email.",
  };
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: identifier },
      ],
    },
  });

  // Standardized generic error for credential mismatch or non-existent user
  const genericAuthError = "Invalid username/email or password.";

  if (!user || !user.password) {
    throw new Error(genericAuthError);
  }

  const now = new Date();

  // 1. Check if user is locked out
  if (user.lockedUntil) {
    if (user.lockedUntil > now) {
      // Actively locked out: return generic message to prevent account enumeration
      throw new Error(genericAuthError);
    }

    // Lockout period has elapsed: auto-reset counter and clear lockout timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
  }

  if (!user.emailVerified) {
    throw new Error("Please verify your email before signing in.");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      },
    });

    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        action: "FAILED_LOGIN",
        details: shouldLock
          ? "Account temporarily locked after 5 consecutive failures"
          : `Attempt ${attempts} of ${MAX_FAILED_ATTEMPTS}`,
      },
    });

    // Never disclose lock status or remaining attempts
    throw new Error(genericAuthError);
  }

  // 2. 2FA Challenge Gate: Check if user has 2FA enabled
  if ((user as any).twoFactorEnabled) {
    const tempToken = generate2FATempToken(user.id);
    return {
      requires2FA: true,
      tempToken,
    };
  }

  // Login successful for standard users: clear any previous failed attempt counters
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
    },
  });

  return {
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
    token: generateToken(user.id, user.role),
  };
}

export async function verify2FALogin(tempToken: string, code: string): Promise<AuthResponse> {
  let payload: any;
  try {
    payload = verifyToken(tempToken);
  } catch {
    throw new Error("2FA session expired. Please sign in again.");
  }

  if (payload.stage !== "2FA_PENDING" || !payload.userId) {
    throw new Error("Invalid authentication state.");
  }

  // Explicitly fetch user with backupCodes and twoFactorSecret
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !(user as any).twoFactorEnabled) {
    throw new Error("Invalid 2FA request.");
  }

  const cleanCode = code.trim().replace(/\s+/g, "");
  let verified = false;

  // 1. If 6 numeric digits, test TOTP first
  if (/^\d{6}$/.test(cleanCode) && (user as any).twoFactorSecret) {
    const authInstance: any =
      (otplib as any).authenticator ||
      (otplib as any).default?.authenticator ||
      (otplib as any).default ||
      otplib;

    try {
      if (typeof authInstance.verify === "function") {
        verified = authInstance.verify({
          token: cleanCode,
          secret: (user as any).twoFactorSecret,
        });
      } else if (typeof authInstance.check === "function") {
        verified = authInstance.check(cleanCode, (user as any).twoFactorSecret);
      }
    } catch (e) {
      console.warn("[2FA] TOTP check failed with error:", e);
    }
  }

  // 2. If not verified, check against backup recovery codes
  if (!verified) {
    const rawBackupCodes = (user as any).backupCodes;
    let backupCodesList: string[] = [];

    if (Array.isArray(rawBackupCodes)) {
      backupCodesList = [...rawBackupCodes];
    } else if (typeof rawBackupCodes === "string") {
      try {
        backupCodesList = JSON.parse(rawBackupCodes);
      } catch {
        backupCodesList = [];
      }
    }

    if (backupCodesList.length > 0) {
      let matchedIndex = -1;
      const normalizedInput = cleanCode.toUpperCase();

      for (let i = 0; i < backupCodesList.length; i++) {
        const storedHash = backupCodesList[i];
        // Support both hashed backup codes and plain matches
        const isMatch =
          storedHash === normalizedInput ||
          (await bcrypt.compare(normalizedInput, storedHash).catch(() => false));

        if (isMatch) {
          matchedIndex = i;
          break;
        }
      }

      if (matchedIndex !== -1) {
        verified = true;
        // Consume the used backup code (one-time use)
        backupCodesList.splice(matchedIndex, 1);
        await (prisma.user as any).update({
          where: { id: user.id },
          data: { backupCodes: backupCodesList },
        });

        await prisma.securityEvent.create({
          data: {
            userId: user.id,
            action: "SECURITY_ALERT" as any,
            details: `One-time backup recovery code consumed. ${backupCodesList.length} codes remaining.`,
          },
        });
      }
    }
  }

  if (!verified) {
    throw new Error("Invalid or expired verification code.");
  }

  // Reset counters & update lastLogin
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    },
  });

  const token = generateToken(user.id, user.role);

  return {
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
  };
}


