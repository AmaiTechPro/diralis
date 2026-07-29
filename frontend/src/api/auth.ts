import type { AuthResponse } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

interface LoginRequest {
  identifier: string;
  password: string;
}

interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export async function login(
  credentials: LoginRequest
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error("Invalid username/email or password.");
  }

  return response.json();
}

export async function register(
  user: RegisterRequest
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error("Registration failed.");
  }

  return response.json();
}

