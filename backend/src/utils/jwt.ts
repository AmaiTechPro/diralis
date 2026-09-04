import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret-key";

const EXPIRES_IN = "7d";

interface TokenPayload {
  userId: string;
  role: string;
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

export function generate2FATempToken(userId: string): string {
  return jwt.sign({ userId, stage: "2FA_PENDING" }, JWT_SECRET, {
    expiresIn: "5m",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}


