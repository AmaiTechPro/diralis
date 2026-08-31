import { Router } from "express";
import { chat } from "../controllers/chatController";
import { authenticate } from "../middleware/authMiddleware";
import {
  requireFeature,
  enforceUsageLimit,
} from "../middleware/entitlementMiddleware";
import prisma from "../lib/prisma";

const router = Router();

router.post(
  "/",
  authenticate,
  requireFeature("aiChat"),
  enforceUsageLimit("aiRequestsPerMonth", async (userId) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return prisma.chatMessage.count({
      where: {
        session: {
          userId,
        },
        role: "user",
        createdAt: {
          gte: startOfMonth,
        },
      },
    });
  }),
  chat
);

export default router;


