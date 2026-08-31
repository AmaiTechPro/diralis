import { Request, Response } from "express";
import { generateChatResponse } from "../services/chat/chatService";
import {
  getUserEntitlements,
  getBillingOverview,
} from "../services/billingService";
import prisma from "../lib/prisma";

export async function chat(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Message is required and must be a non-empty string.",
      });
    }

    // 1. Validate monthly AI request quota before running generation
    const entitlements = await getUserEntitlements(userId);
    const limits = (entitlements.limits || {}) as Record<string, any>;
    const aiLimit = typeof limits.aiRequestsPerMonth === "number" ? limits.aiRequestsPerMonth : null;

    if (aiLimit !== null) {
      const overview = await getBillingOverview(userId);
      const currentUsage = overview.usage?.aiRequestsPerMonth ?? 0;

      if (currentUsage >= aiLimit) {
        return res.status(403).json({
          error: "AI_QUOTA_EXCEEDED",
          message: `Monthly AI request limit of ${aiLimit} reached on your plan. Upgrade your subscription to continue.`,
        });
      }
    }

    // 2. Generate response using MAP context
    const reply = await generateChatResponse(userId, message.trim());

    // 3. Atomically increment usage record in billing metrics
    const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    try {
      // Upsert billing metric usage if usage tracking table exists
      const usageDelegate = (prisma as any).planUsageMetric || (prisma as any).usageMetric;
      if (usageDelegate?.upsert) {
        await usageDelegate.upsert({
          where: {
            userId_metric_period: {
              userId,
              metric: "aiRequestsPerMonth",
              period: currentMonthKey,
            },
          },
          update: { count: { increment: 1 } },
          create: {
            userId,
            metric: "aiRequestsPerMonth",
            period: currentMonthKey,
            count: 1,
          },
        });
      }
    } catch {
      // Non-blocking metric recording fallback
    }

    return res.json({
      reply,
    });
  } catch (error: any) {
    console.error("Chat Controller Error:", error);

    if (error.message === "No dataset available. Please upload a dataset first.") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to process chat request.",
    });
  }
}


