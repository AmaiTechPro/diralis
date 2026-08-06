import crypto from "crypto";
import prisma from "../../lib/prisma";
import { sendVerificationEmail } from "../emailService";

function generateCode() {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

export async function resendVerificationCode(
  email: string
) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      emailVerifications: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.emailVerified) {
    throw new Error("Email already verified.");
  }

  const latest =
    user.emailVerifications[0];

  if (
    latest &&
    Date.now() -
      latest.createdAt.getTime() <
      60 * 1000
  ) {
    throw new Error(
      "Please wait before requesting another code."
    );
  }

  const code = generateCode();

  const codeHash = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");

  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt: new Date(
        Date.now() + 10 * 60 * 1000
      ),
    },
  });

  await sendVerificationEmail(
    user.email,
    user.fullName,
    code
  );

  return {
    message:
      "Verification code sent successfully.",
  };
}


