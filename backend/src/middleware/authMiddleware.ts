import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization header missing.",
    });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = verifyToken(token) as {
      userId: string;
    };

    req.userId = decoded.userId;

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token.",
    });
  }
}


