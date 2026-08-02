import crypto from "crypto";

import bcrypt from "bcrypt";

import prisma from "../lib/prisma";

import { sendEmail } from "./emailService";

export async function requestPasswordReset(
  email: string
) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return;
  }

  // Remove any previous reset token
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
    },
  });

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString("hex");

  // Store only the hash in the database
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + 1000 * 60 * 30
  ); // 30 minutes

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetLink =
    `${process.env.APP_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,

    subject: "Reset your Diralis password",

    html: `
      <h2>Diralis Password Reset</h2>

      <p>Hello ${user.fullName},</p>

      <p>You requested to reset your password.</p>

      <p>
        <a href="${resetLink}">
          Reset Password
        </a>
      </p>

      <p>This link expires in 30 minutes.</p>

      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

export async function resetPassword(
  token: string,
  password: string
) {
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const record =
    await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },

      include: {
        user: true,
      },
    });

  if (
    !record ||
    record.expiresAt < new Date()
  ) {
    throw new Error("Invalid or expired token.");
  }

  const hashedPassword =
    await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: {
      id: record.user.id,
    },

    data: {
      password: hashedPassword,
    },
  });

  await prisma.passwordResetToken.delete({
    where: {
      id: record.id,
    },
  });
}

