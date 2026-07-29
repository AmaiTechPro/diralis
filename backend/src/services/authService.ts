import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { generateToken } from "../utils/jwt";


type AuthResponse = {
  user: Omit<User, "password">;
  token: string;
};


import {
  addUser,
  findUserByEmail,
  User,
} from "../models/userModel";

const SALT_ROUNDS = 10;

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const existingUser = findUserByEmail(email);

  if (existingUser) {
    throw new Error("Email already registered.");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    SALT_ROUNDS
  );

  const user: User = {
    id: randomUUID(),
    name,
    email,
    password: hashedPassword,
  };

  addUser(user);

  const token = generateToken(user.id);

const { password: _, ...safeUser } = user;

return {
  user: safeUser,
  token,
};
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const user = findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password.");
  }

  const token = generateToken(user.id);

const { password: _, ...safeUser } = user;

return {
  user: safeUser,
  token,
};
}


