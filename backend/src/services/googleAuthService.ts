import { OAuth2Client } from "google-auth-library";

import prisma from "../lib/prisma";
import { generateToken } from "../utils/jwt";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

export interface GoogleUser {
  googleId: string;
  email: string;
  fullName: string;
  picture?: string;
}

export async function verifyGoogleToken(
  idToken: string
): Promise<GoogleUser> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Invalid Google token.");
  }

  return {
    googleId: payload.sub,
    email: payload.email!,
    fullName: payload.name!,
    picture: payload.picture,
  };
}

export async function loginWithGoogle(
  credential: string
) {
  const googleUser =
    await verifyGoogleToken(credential);

  let user =
    await prisma.user.findUnique({
      where: {
        email: googleUser.email,
      },
    });

  if (!user) {
    let username =
      googleUser.email
        .split("@")[0]
        .toLowerCase();

    // Ensure username is unique
    let counter = 1;

    while (
      await prisma.user.findUnique({
        where: { username },
      })
    ) {
      username =
        `${googleUser.email
          .split("@")[0]
          .toLowerCase()}${counter}`;

      counter++;
    }

    user =
      await prisma.user.create({
        data: {
          fullName: googleUser.fullName,
          username,
          email: googleUser.email,
          provider: "google",
          googleId: googleUser.googleId,
          picture: googleUser.picture,
        },
      });
  }

  const token =
    generateToken(user.id);

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      provider: user.provider,
      picture: user.picture,
      createdAt: user.createdAt,
    },
    token,
  };
}


