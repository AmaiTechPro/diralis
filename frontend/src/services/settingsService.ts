import api from "./api";

export async function getSettings() {
  const response = await api.get("/settings");
  return response.data;
}

export async function updateSettings(data: {
  theme?: string;
  emailNotifications?: boolean;
}) {
  const response = await api.patch("/settings", data);
  return response.data;
}

export async function updateProfile(data: {
  fullName: string;
  email: string;
}) {
  const response = await api.patch("/settings/profile", data);
  return response.data;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await api.put("/settings/password", data);
  return response.data;
}

export async function setup2FA(): Promise<{ secret: string; qrCode: string }> {
  const response = await api.post("/settings/2fa/setup");
  return response.data;
}

export async function verify2FA(
  token: string
): Promise<{ message: string; backupCodes: string[] }> {
  const response = await api.post("/settings/2fa/verify", { token });
  return response.data;
}

export async function disable2FA(
  password: string
): Promise<{ message: string }> {
  const response = await api.post("/settings/2fa/disable", { password });
  return response.data;
}