import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

import { generateToken } from "../utils/jwt";

import {
  addUser,
  findUserByEmail,
  findUserByUsername,
  findUserByIdentifier,
  User,
} from "../models/userModel";

type AuthResponse = {
  user: Omit<User, "password">;
  token: string;
};

const SALT_ROUNDS = 10;

export async function registerUser(
  fullName: string,
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  if (findUserByEmail(email)) {
    throw new Error("Email already registered.");
  }

  if (findUserByUsername(username)) {
    throw new Error("Username already taken.");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    SALT_ROUNDS
  );

  const user: User = {
    id: randomUUID(),
    fullName,
    username,
    email,
    password: hashedPassword,
    provider: "local",
    createdAt: new Date(),
  };

  addUser(user);

  const { password: _, ...safeUser } = user;

  return {
    user: safeUser,
    token: generateToken(user.id),
  };
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const user = findUserByIdentifier(identifier);

  if (!user) {
    throw new Error(
      "Invalid username/email or password."
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw new Error(
      "Invalid username/email or password."
    );
  }

  const { password: _, ...safeUser } = user;

  return {
    user: safeUser,
    token: generateToken(user.id),
  };
}


