import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { apiFetch } from "../api/client";

export interface PasskeyItem {
  id: string;
  name: string;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

// 1. Fetch registered passkeys for current user
export async function getPasskeys(): Promise<PasskeyItem[]> {
  const data = await apiFetch<{ passkeys: PasskeyItem[] }>("/auth/passkeys");
  return data?.passkeys || [];
}

// 2. Register a new passkey from Settings
export async function registerPasskey(nickname: string): Promise<void> {
  const options = await apiFetch<any>("/auth/passkeys/register-options", {
    method: "POST",
  });

  const registrationResponse = await startRegistration({ optionsJSON: options });

  await apiFetch("/auth/passkeys/register-verify", {
    method: "POST",
    body: JSON.stringify({
      response: registrationResponse,
      name: nickname || "Security Key",
    }),
  });
}

// 3. Remove a passkey
export async function deletePasskey(passkeyId: string): Promise<void> {
  await apiFetch(`/auth/passkeys/${passkeyId}`, {
    method: "DELETE",
  });
}

// 4. Authenticate via Passkey during 2FA Login
export async function authenticateWithPasskey(tempToken: string) {
  const options = await apiFetch<any>("/auth/login/passkey/options", {
    method: "POST",
    body: JSON.stringify({ tempToken }),
  });

  const authResponse = await startAuthentication({ optionsJSON: options });

  const verifyRes = await apiFetch<{ token: string; user: any }>("/auth/login/passkey/verify", {
    method: "POST",
    body: JSON.stringify({
      tempToken,
      response: authResponse,
    }),
  });

  return verifyRes;
}


