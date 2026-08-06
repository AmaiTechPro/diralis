import crypto from "crypto";

import prisma from "../../lib/prisma";

import { generateToken } from "../../utils/jwt";

export async function verifyEmailCode(

  email: string,

  code: string

) {

  const user =
    await prisma.user.findUnique({

      where: { email },

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

    throw new Error(
      "Account not found."
    );

  }

  const verification =
    user.emailVerifications[0];

  if (!verification) {

    throw new Error(
      "Verification code not found."
    );

  }

  if (verification.verifiedAt) {

    throw new Error(
      "Email already verified."
    );

  }

  if (
    verification.expiresAt <
    new Date()
  ) {

    throw new Error(
      "Verification code has expired."
    );

  }

  const codeHash =
    crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

  if (
    codeHash !==
    verification.codeHash
  ) {

    await prisma.emailVerification.update({

      where: {

        id: verification.id,

      },

      data: {

        attempts: {

          increment: 1,

        },

      },

    });

    throw new Error(
      "Invalid verification code."
    );

  }

  await prisma.$transaction([

    prisma.user.update({

      where: {

        id: user.id,

      },

      data: {

        emailVerified: true,

      },

    }),

    prisma.emailVerification.update({

      where: {

        id: verification.id,

      },

      data: {

        verifiedAt: new Date(),

      },

    }),

  ]);

  return {

    token: generateToken(

      user.id,

      user.role

    ),

    user: {

      id: user.id,

      fullName: user.fullName,

      username: user.username,

      email: user.email,

      role: user.role,

      picture: user.picture,

      provider: user.provider,

      status: user.status,

      createdAt: user.createdAt,

    },

  };

}

