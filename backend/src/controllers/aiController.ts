import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { getAIProvider } from "../services/ai/providerFactory";
import { DIRALIS_SYSTEM_PROMPT } from "../ai/prompts";
import { buildMAPContext, buildDatasetContext } from "../services/contextService";
import { assembleMultiTurnPrompt } from "../services/ai/contextWindowManager";
import {
  hasFeature,
  getUserUsageMetrics,
  getUsageLimit,
} from "../services/billingService";

export async function sendMessage(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Authentication required." });

    const sessionId = req.params.sessionId as string;
    const { content, datasetId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Content is required." });
    }

    // 1. Session and Workspace Verification
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId, archivedAt: null },
    });

    if (!session) {
      return res.status(404).json({ message: "Chat session not found in your workspace." });
    }

    const activeDatasetId = datasetId || session.datasetId;

    // 2. Dataset Authorization
    if (activeDatasetId) {
      const authorizedDataset = await prisma.dataset.findFirst({
        where: { id: activeDatasetId, userId },
      });
      if (!authorizedDataset) {
        return res.status(404).json({ message: "Requested dataset not found in your workspace." });
      }

      // Link dataset if not linked previously
      if (!session.datasetId) {
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { datasetId: activeDatasetId },
        });
      }
    }

    // 3. Subscription Entitlement & Quota Check
    const hasAIChat = await hasFeature(userId, "aiChat");
    if (!hasAIChat) {
      return res.status(403).json({
        code: "FEATURE_NOT_ENTITLED",
        message: "AI Chat is not enabled on your current subscription plan.",
      });
    }

    const usage = await getUserUsageMetrics(userId);
    const quotaLimit = await getUsageLimit(userId, "aiRequestsPerMonth");
    if (quotaLimit !== null && usage.aiRequestsPerMonth >= quotaLimit) {
      return res.status(403).json({
        code: "QUOTA_EXHAUSTED",
        message: `Monthly AI quota exhausted (${usage.aiRequestsPerMonth}/${quotaLimit}).`,
      });
    }

    // 4. Retrieve Bounded Recent History
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: { role: true, content: true },
    });

    // 5. Build Separated Context Layers
    let mapContext = "";
    let datasetOverview = "";
    let isMapAvailable = false;

    try {
      const [mapRes, datasetRes] = await Promise.all([
        buildMAPContext(userId, activeDatasetId || undefined),
        buildDatasetContext(userId, activeDatasetId || undefined),
      ]);
      mapContext = mapRes;
      datasetOverview = datasetRes;
      isMapAvailable = !!(mapContext && mapContext.trim().length > 0);
    } catch {
      isMapAvailable = false;
    }

    const messages = assembleMultiTurnPrompt(
      DIRALIS_SYSTEM_PROMPT,
      datasetOverview,
      mapContext,
      history,
      content.trim()
    );

    // 6. Invoke AI Provider with Protected Fallback
    let reply = "";
    let status: "SUCCESS" | "DETERMINISTIC_FALLBACK" | "PROVIDER_UNAVAILABLE" = "SUCCESS";
    let isAIAvailable = false;

    try {
      const provider = getAIProvider();
      reply = await provider.generateCompletion({ messages });
      isAIAvailable = true;
      status = "SUCCESS";
    } catch (providerError: any) {
      const errMsg = (providerError?.message || "").toLowerCase();
      
      if (isMapAvailable) {
        status = "DETERMINISTIC_FALLBACK";
        reply = "AI interpretation is temporarily unavailable. Based on the verified dataset analytics (MAP), statistical distributions and schema properties remain accessible in your dashboard.";
      } else {
        status = "PROVIDER_UNAVAILABLE";
        reply = "Diralis AI is temporarily unavailable. Please retry your question in a moment.";
      }
    }

    // 7. Atomic Transaction: Persist User + Assistant messages & update session timestamp
    const isFirstMessage = history.length === 0;
    const computedTitle = isFirstMessage
      ? content.trim().substring(0, 50)
      : undefined;

    const [userMessage, assistantMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "user",
          content: content.trim(),
        },
      }),
      prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "assistant",
          content: reply,
        },
      }),
      prisma.chatSession.update({
        where: { id: session.id },
        data: {
          updatedAt: new Date(),
          ...(computedTitle && session.title === "New Conversation" ? { title: computedTitle } : {}),
        },
      }),
    ]);

    return res.status(200).json({
      status,
      reply: assistantMessage.content,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      sessionId: session.id,
      ai: {
        available: isAIAvailable,
        source: isAIAvailable ? "LLM_SYNTHESIS" : (status === "DETERMINISTIC_FALLBACK" ? "DETERMINISTIC_ENGINE" : "NONE"),
        quotaConsumed: isAIAvailable,
      },
      analytical: {
        available: isMapAvailable,
        source: isMapAvailable ? "MAP" : "NONE",
      },
      usage: {
        current: usage.aiRequestsPerMonth + (isAIAvailable ? 1 : 0),
        limit: quotaLimit,
      },
      retryable: !isAIAvailable,
    });
  } catch (error: any) {
    if (error?.message?.includes("timeout")) {
      return res.status(504).json({ message: "AI provider timed out." });
    }
    return res.status(500).json({ message: "AI analysis request failed. Internal error." });
  }
}

