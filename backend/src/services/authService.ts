import bcrypt from "bcryptjs";

import prisma from "../lib/prisma";
import { generateToken } from "../utils/jwt";

import crypto from "crypto";

import {
  sendVerificationEmail,
} from "./emailService";


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
};

const SALT_ROUNDS = 10;

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

  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();

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

  const existingUsername =
    await prisma.user.findUnique({
      where: { username },
    });

  if (existingUsername) {
    throw new Error("Username already taken.");
  }
  validatePassword(password);

  const hashedPassword = await bcrypt.hash(
    password,
    SALT_ROUNDS
  );

  const verificationCode =
  generateVerificationCode();

const codeHash =
  crypto
    .createHash("sha256")
    .update(verificationCode)
    .digest("hex");

const expiresAt =
  new Date(
    Date.now() + 10 * 60 * 1000
  );

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
  message:
    "Verification code sent to your email.",
};
   }

export async function loginUser(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const user =
    await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

  if (!user || !user.password) {
    throw new Error(
      "Invalid username/email or password."
    );
  }

  if (!user.emailVerified) {

  throw new Error(
    "Please verify your email before signing in."
  );

}

  const passwordMatches =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!passwordMatches) {
    throw new Error(
      "Invalid username/email or password."
    );
  }

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
    token: generateToken(
  user.id,
  user.role
   ),
  };
}


