import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { getAIProvider } from "../services/ai/providerFactory";
import { DIRALIS_SYSTEM_PROMPT } from "../ai/prompts";
import { buildMAPContext, buildDatasetContext } from "../services/contextService";
import { assembleMultiTurnPrompt } from "../services/ai/contextWindowManager";
import { EntitlementService } from "../services/entitlementService";
import { getUserUsageMetrics, getUsageLimit } from "../services/billingService";

export async function sendMessage(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ code: "AUTH_REQUIRED", message: "Authentication required." });

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
      return res.status(404).json({ code: "RESOURCE_UNAUTHORIZED", message: "Chat session not found in your workspace." });
    }

    const activeDatasetId = datasetId || session.datasetId;

    // 2. Centralized Entitlement & Quota Evaluation
    const entitlement = await EntitlementService.evaluate(userId, {
      requiredFeature: "aiChat",
      quotaMetric: "aiRequestsPerMonth",
      datasetId: activeDatasetId || undefined,
    });

    if (!entitlement.allowed) {
      return res.status(entitlement.statusCode).json({
        code: entitlement.code,
        message: entitlement.message,
        details: entitlement.details,
      });
    }

    if (activeDatasetId && !session.datasetId) {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { datasetId: activeDatasetId },
      });
    }

    // 3. Retrieve Bounded Recent History
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: { role: true, content: true },
    });

    // 4. Build Separated Context Layers
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

    // 5. Invoke AI Provider with Protected Fallback
    let reply = "";
    let status: "SUCCESS" | "DETERMINISTIC_FALLBACK" | "PROVIDER_UNAVAILABLE" = "SUCCESS";
    let isAIAvailable = false;

    try {
      const provider = getAIProvider();
      reply = await provider.generateCompletion({ messages });
      isAIAvailable = true;
      status = "SUCCESS";
    } catch (providerError: any) {
      if (isMapAvailable) {
        status = "DETERMINISTIC_FALLBACK";
        reply = "AI interpretation is temporarily unavailable. Based on the verified dataset analytics (MAP), statistical distributions and schema properties remain accessible in your dashboard.";
      } else {
        status = "PROVIDER_UNAVAILABLE";
        reply = "Diralis AI is temporarily unavailable. Please retry your question in a moment.";
      }
    }

    // 6. Atomic Transaction: Persist User + Assistant messages
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

    const usage = await getUserUsageMetrics(userId);
    const quotaLimit = await getUsageLimit(userId, "aiRequestsPerMonth");

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
        current: usage.aiRequestsPerMonth,
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

