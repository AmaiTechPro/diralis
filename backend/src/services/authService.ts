import bcrypt from "bcryptjs";

import prisma from "../lib/prisma";
import { generateToken } from "../utils/jwt";

type AuthResponse = {
 user: {
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
  token: string;
};

const SALT_ROUNDS = 10;

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

  const hashedPassword = await bcrypt.hash(
    password,
    SALT_ROUNDS
  );

  const user = await prisma.user.create({
    data: {
      fullName,
      username,
      email,
      password: hashedPassword,
      provider: "local",
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
    token: generateToken(
    user.id,
    user.role
   ),
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


