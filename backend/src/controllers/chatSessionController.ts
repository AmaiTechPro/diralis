import { Request, Response } from "express";
import prisma from "../lib/prisma";

const MAX_PAGE_LIMIT = 50;

/**
 * 1. POST /api/ai/sessions - Create new chat session
 */
export async function createSession(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

    const { title, datasetId } = req.body;

    // Dataset ownership validation
    if (datasetId) {
      const dataset = await prisma.dataset.findFirst({
        where: { id: String(datasetId), userId },
      });
      if (!dataset) {
        return res.status(404).json({ message: "Dataset not found in your workspace." });
      }
    }

    const session = await prisma.chatSession.create({
      data: {
        userId,
        datasetId: datasetId ? String(datasetId) : null,
        title: title?.trim().substring(0, 80) || "New Conversation",
      },
      select: {
        id: true,
        title: true,
        datasetId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({ session });
  } catch (error) {
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to create session." });
  }
}

/**
 * 2. GET /api/ai/sessions - List user sessions with message count (Paginated)
 */
export async function listSessions(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where: { userId, archivedAt: null },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          datasetId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.chatSession.count({ where: { userId, archivedAt: null } }),
    ]);

    return res.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        datasetId: s.datasetId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: s._count.messages,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve sessions." });
  }
}

/**
 * 3. GET /api/ai/sessions/:sessionId - Get single session
 */
export async function getSession(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId, archivedAt: null },
      include: {
        dataset: {
          select: { id: true, originalName: true, mimetype: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    return res.json({
      session: {
        id: session.id,
        title: session.title,
        dataset: session.dataset,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session._count.messages,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

/**
 * 4. PATCH /api/ai/sessions/:sessionId - Rename session
 */
export async function updateSession(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;
    const { title } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Title is required." });
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId, archivedAt: null },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: title.trim().substring(0, 80) },
      select: { id: true, title: true, updatedAt: true },
    });

    return res.json({ session: updated });
  } catch (error) {
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

/**
 * 5. DELETE /api/ai/sessions/:sessionId - Delete/Archive session
 */
export async function deleteSession(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    // Cascade delete session and all linked messages
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return res.json({ success: true, message: "Session deleted successfully." });
  } catch (error) {
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

/**
 * 6. GET /api/ai/sessions/:sessionId/messages - Message history pagination
 */
export async function getSessionMessages(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId, archivedAt: null },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { sessionId },
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      }),
      prisma.chatMessage.count({ where: { sessionId } }),
    ]);

    return res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

