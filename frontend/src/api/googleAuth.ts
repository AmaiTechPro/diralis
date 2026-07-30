import type { AuthResponse } from "../types/auth";

const API_URL =
  `${import.meta.env.VITE_API_URL}/auth/google`;

export async function googleLogin(
  credential: string
): Promise<AuthResponse> {

  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      credential,
    }),
  });

  if (!response.ok) {
    throw new Error("Google login failed.");
  }

  return response.json();
}

