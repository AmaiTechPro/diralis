import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "development-secret-key";

const EXPIRES_IN = "7d";

export function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    {
      expiresIn: EXPIRES_IN,
    }
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}


