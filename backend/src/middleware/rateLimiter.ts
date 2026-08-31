import rateLimit from "express-rate-limit";
import { Request } from "express";

/**
 * Standard API Rate Limiter
 * Applied across general endpoints: 300 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TOO_MANY_REQUESTS",
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

/**
 * Strict Auth Limiter
 * Protects login, registration, and password recovery from brute-force: 15 attempts / 15 min
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "AUTH_RATE_LIMIT_EXCEEDED",
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

/**
 * AI & LLM Generation Limiter
 * Protects compute-heavy model inference: 25 requests / minute
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as any).user?.userId || req.ip || "unknown";
  },
  message: {
    error: "AI_RATE_LIMIT_EXCEEDED",
    message: "You are sending AI queries too quickly. Please wait a moment before trying again.",
  },
});

/**
 * Dataset Upload Limiter
 * Prevents file processing exhaustion: 20 uploads / 15 min
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "UPLOAD_RATE_LIMIT_EXCEEDED",
    message: "Upload threshold reached. Please wait before uploading additional datasets.",
  },
});


