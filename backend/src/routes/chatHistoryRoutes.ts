import { Router } from "express";

import { authenticate } from "../middleware/authMiddleware";

import {
  createSession,
  getSessions,
  getMessages,
  removeSession,
} from "../controllers/chatHistoryController";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  getSessions
);

router.post(
  "/",
  createSession
);

router.get(
  "/:id",
  getMessages
);

router.delete(
  "/:id",
  removeSession
);

export default router;

