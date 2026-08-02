import api from "../services/api";

import type { AuthResponse } from "../types/auth";

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

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

export async function login(
  credentials: LoginRequest
): Promise<AuthResponse> {
  const response =
    await api.post<AuthResponse>(
      "/auth/login",
      credentials
    );

  return response.data;
}

export async function register(
  user: RegisterRequest
): Promise<AuthResponse> {
  const response =
    await api.post<AuthResponse>(
      "/auth/register",
      user
    );

  return response.data;
}

export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<{ message: string }> {
  const response =
    await api.post(
      "/auth/forgot-password",
      data
    );

  return response.data;
}

export async function resetPassword(
  data: ResetPasswordRequest
): Promise<{ message: string }> {
  const response =
    await api.post(
      "/auth/reset-password",
      data
    );

  return response.data;
}

