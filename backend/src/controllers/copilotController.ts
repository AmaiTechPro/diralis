import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function getInsightsFeed(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const datasetId = req.params.datasetId as string;

    if (!userId) return res.status(401).json({ message: "Authentication required." });
    if (!datasetId) return res.status(400).json({ message: "Dataset ID is required." });

    // Ensure dataset belongs to the user
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, userId },
    });

    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found in your workspace." });
    }

    const insights = await prisma.copilotInsight.findMany({
      where: {
        userId,
        datasetId,
        dismissedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return res.json({ insights });
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve proactive insights feed." });
  }
}

export async function dismissInsight(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const insightId = req.params.insightId as string;

    if (!userId) return res.status(401).json({ message: "Authentication required." });
    if (!insightId) return res.status(400).json({ message: "Insight ID is required." });

    const insight = await prisma.copilotInsight.findFirst({
      where: { id: insightId, userId },
    });

    if (!insight) {
      return res.status(404).json({ message: "Insight not found." });
    }

    await prisma.copilotInsight.update({
      where: { id: insightId },
      data: { dismissedAt: new Date() },
    });

    return res.json({ success: true, message: "Insight dismissed." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to dismiss insight." });
  }
}

