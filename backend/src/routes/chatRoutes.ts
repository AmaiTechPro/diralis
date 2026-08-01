import { Router } from "express";

import { chat } from "../controllers/chatController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/",
  authenticate,
  chat
);

export default router;

