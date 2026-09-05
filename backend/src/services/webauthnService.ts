import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import prisma from "../lib/prisma";

// Relying Party & Origin Configuration
const rpName = process.env.WEBAUTHN_RP_NAME || "Diralis Enterprise";
const rpID =
  process.env.WEBAUTHN_RP_ID ||
  (process.env.NODE_ENV === "production" ? "diralishq.com" : "localhost");

const defaultOrigins = [
  "https://www.diralishq.com",
  "https://diralishq.com",
  "http://localhost:5173",
];

const expectedOrigin = process.env.WEBAUTHN_ORIGIN
  ? [process.env.WEBAUTHN_ORIGIN, ...defaultOrigins]
  : defaultOrigins;

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getRegistrationOptions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { passkeys: true },
  });

  if (!user) throw new Error("User not found.");

  // Exclude existing credentials to prevent duplicate enrollments
  const excludeCredentials = user.passkeys.map((p) => ({
    id: p.credentialId,
    transports: p.transports as any,
  }));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new Uint8Array(Buffer.from(user.id)),
    userName: user.email,
    userDisplayName: user.fullName || user.username,
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Persist ephemeral challenge
  await prisma.webAuthnChallenge.create({
    data: {
      userId: user.id,
      challenge: options.challenge,
      type: "REGISTRATION",
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    },
  });

  return options;
}

export async function verifyAndSaveRegistration(
  userId: string,
  response: any,
  credentialNickname?: string
) {
  const challengeRecord = await prisma.webAuthnChallenge.findFirst({
    where: {
      userId,
      type: "REGISTRATION",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challengeRecord) {
    throw new Error("Registration challenge expired or not found. Please try again.");
  }

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
  } catch (error: any) {
    throw new Error(`Passkey verification failed: ${error.message}`);
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Could not verify passkey registration.");
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  // Consume challenge
  await prisma.webAuthnChallenge.delete({
    where: { id: challengeRecord.id },
  });

  // Save passkey credential
  const newPasskey = await prisma.passkeyCredential.create({
    data: {
      userId,
      name: credentialNickname?.trim() || "Security Key",
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: (response.response.transports as string[]) || [],
    },
  });

  await prisma.securityEvent.create({
    data: {
      userId,
      action: "WEBAUTHN_REGISTERED",
      details: `Enrolled passkey: "${newPasskey.name}"`,
    },
  });

  return {
    id: newPasskey.id,
    name: newPasskey.name,
    createdAt: newPasskey.createdAt,
  };
}

export async function getAuthenticationOptions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { passkeys: true },
  });

  if (!user || user.passkeys.length === 0) {
    throw new Error("No passkeys registered for this user.");
  }

  const allowCredentials = user.passkeys.map((p) => ({
    id: p.credentialId,
    transports: p.transports as any,
  }));

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: "preferred",
  });

  await prisma.webAuthnChallenge.create({
    data: {
      userId: user.id,
      challenge: options.challenge,
      type: "AUTHENTICATION",
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    },
  });

  return options;
}

export async function verifyAuthentication(userId: string, response: any) {
  const passkey = await prisma.passkeyCredential.findUnique({
    where: { credentialId: response.id },
  });

  if (!passkey || passkey.userId !== userId) {
    throw new Error("Unknown or unauthorized passkey credential.");
  }

  const challengeRecord = await prisma.webAuthnChallenge.findFirst({
    where: {
      userId,
      type: "AUTHENTICATION",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challengeRecord) {
    throw new Error("Authentication challenge expired. Please retry.");
  }

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as any,
      },
      requireUserVerification: false,
    });
  } catch (error: any) {
    throw new Error(`Passkey authentication failed: ${error.message}`);
  }

  if (!verification.verified) {
    throw new Error("Passkey could not be verified.");
  }

  // Consume challenge to protect against replays
  await prisma.webAuthnChallenge.delete({
    where: { id: challengeRecord.id },
  });

  // Update signature counter & last used time
  await prisma.passkeyCredential.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  await prisma.securityEvent.create({
    data: {
      userId,
      action: "WEBAUTHN_AUTHENTICATED",
      details: `Authenticated with passkey: "${passkey.name}"`,
    },
  });

  return true;
}

export async function listUserPasskeys(userId: string) {
  const passkeys = await prisma.passkeyCredential.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      deviceType: true,
      backedUp: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return passkeys;
}

export async function deletePasskey(userId: string, passkeyId: string) {
  const passkey = await prisma.passkeyCredential.findFirst({
    where: { id: passkeyId, userId },
  });

  if (!passkey) throw new Error("Passkey not found.");

  await prisma.passkeyCredential.delete({
    where: { id: passkeyId },
  });

  const remainingPasskeys = await prisma.passkeyCredential.count({
    where: { userId },
  });
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Only turn off twoFactorEnabled if the user has no TOTP secret configured either
  if (remainingPasskeys === 0 && !user?.twoFactorSecret) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
    });
  }

  await prisma.securityEvent.create({
    data: {
      userId,
      action: "WEBAUTHN_REVOKED",
      details: `Revoked passkey: "${passkey.name}"`,
    },
  });

  return { message: "Passkey removed." };
}


