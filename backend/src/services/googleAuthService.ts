import { OAuth2Client } from "google-auth-library";

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

import { randomUUID } from "crypto";

import {
  User,
  addUser,
  findUserByEmail,
} from "../models/userModel";

import { generateToken } from "../utils/jwt";

export async function loginWithGoogle(
  credential: string
) {
  const googleUser =
    await verifyGoogleToken(credential);

  let user =
    findUserByEmail(googleUser.email);

  if (!user) {
    user = {
      id: randomUUID(),
      fullName: googleUser.fullName,

      username:
        googleUser.email
          .split("@")[0]
          .toLowerCase(),

      email: googleUser.email,

      provider: "google",

      googleId: googleUser.googleId,

      picture: googleUser.picture,

      createdAt:
        new Date().toISOString(),
    };

    addUser(user);
  }

  const token =
    generateToken(user.id);

  return {
    user,
    token,
  };
}



