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

/**
 * Translates low-level browser WebAuthn / FIDO2 exceptions and spec URLs
 * into clean, user-friendly messages.
 */
function sanitizePasskeyError(err: any, fallbackMessage: string): Error {
  const name = err?.name || "";
  const rawMessage = (err?.message || err?.toString() || "").toLowerCase();

  // User cancelled the prompt, closed the dialog, or request timed out
  if (
    name === "NotAllowedError" ||
    rawMessage.includes("not allowed") ||
    rawMessage.includes("timed out") ||
    rawMessage.includes("privacy-considerations") ||
    rawMessage.includes("cancelled") ||
    rawMessage.includes("canceled")
  ) {
    return new Error("Passkey prompt was cancelled or timed out. Please try again.");
  }

  // Device not recognized or not registered to this specific account
  if (name === "InvalidStateError" || rawMessage.includes("not registered")) {
    return new Error("This security key or biometric device is not registered to your account.");
  }

  // User's device or browser lacks hardware / platform authenticator support
  if (name === "NotSupportedError") {
    return new Error("Passkeys and biometric sign-in are not supported on this device or browser.");
  }

  // Operation was actively aborted
  if (name === "AbortError") {
    return new Error("Passkey verification was cancelled.");
  }

  // Clean up any remaining backend or network message if available
  const cleanMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message;
  if (cleanMsg && !cleanMsg.includes("http://") && !cleanMsg.includes("https://")) {
    return new Error(cleanMsg);
  }

  return new Error(fallbackMessage);
}

// 1. Fetch registered passkeys for current user
export async function getPasskeys(): Promise<PasskeyItem[]> {
  try {
    const data = await apiFetch<{ passkeys: PasskeyItem[] }>("/auth/passkeys");
    return data?.passkeys || [];
  } catch (err: any) {
    throw sanitizePasskeyError(err, "Failed to retrieve registered passkeys.");
  }
}

// 2. Register a new passkey from Settings or Onboarding
export async function registerPasskey(nickname: string): Promise<void> {
  let options: any;

  try {
    options = await apiFetch<any>("/auth/passkeys/register-options", {
      method: "POST",
    });
  } catch (err: any) {
    throw sanitizePasskeyError(err, "Failed to initialize passkey registration.");
  }

  let registrationResponse: any;
  try {
    registrationResponse = await startRegistration({ optionsJSON: options });
  } catch (err: any) {
    throw sanitizePasskeyError(err, "Passkey setup was cancelled or timed out.");
  }

  try {
    await apiFetch("/auth/passkeys/register-verify", {
      method: "POST",
      body: JSON.stringify({
        response: registrationResponse,
        name: nickname || "Security Key",
      }),
    });
  } catch (err: any) {
    throw sanitizePasskeyError(err, "Failed to confirm passkey registration with the server.");
  }
}

// 3. Remove a passkey
export async function deletePasskey(passkeyId: string): Promise<void> {
  try {
    await apiFetch(`/auth/passkeys/${passkeyId}`, {
      method: "DELETE",
    });
  } catch (err: any) {
    throw sanitizePasskeyError(err, "Failed to remove passkey.");
  }
}

// 4. Authenticate via Passkey during 2FA Login
export async function authenticateWithPasskey(tempToken: string) {
  let options: any;

  try {
    options = await apiFetch<any>("/auth/login/passkey/options", {
      method: "POST",
      body: JSON.stringify({ tempToken }),
    });
  } catch (err: any) {
    throw sanitizePasskeyError(err, "Failed to initiate passkey sign-in.");
  }

  let authResponse: any;
  try {
    authResponse = await startAuthentication({ optionsJSON: options });
  } catch (err: any) {
    throw sanitizePasskeyError(err, "Passkey prompt was cancelled or timed out. Please try again.");
  }

  try {
    const verifyRes = await apiFetch<{ token: string; user: any }>("/auth/login/passkey/verify", {
      method: "POST",
      body: JSON.stringify({
        tempToken,
        response: authResponse,
      }),
    });

    return verifyRes;
  } catch (err: any) {
    throw sanitizePasskeyError(err, "Invalid passkey response or verification failed.");
  }
}


