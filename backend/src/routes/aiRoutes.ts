import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { aiLimiter } from "../middleware/rateLimiter";
import { sendMessage } from "../controllers/aiController";
import {
  createSession,
  listSessions,
  getSession,
  updateSession,
  deleteSession,
  getSessionMessages,
} from "../controllers/chatSessionController";

const router = Router({ mergeParams: true });

// Session lifecycle routes
router.post("/sessions", authenticate, createSession);
router.get("/sessions", authenticate, listSessions);
router.get("/sessions/:sessionId", authenticate, getSession);
router.patch("/sessions/:sessionId", authenticate, updateSession);
router.delete("/sessions/:sessionId", authenticate, deleteSession);

// Multi-turn message & history routes
router.get("/sessions/:sessionId/messages", authenticate, getSessionMessages);
router.post("/sessions/:sessionId/messages", authenticate, aiLimiter, sendMessage);

export default router;

