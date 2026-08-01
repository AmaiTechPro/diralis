import { Request, Response } from "express";
import { generateChatResponse } from "../services/chat/chatService";

export async function chat(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user!.userId;

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const reply = await generateChatResponse(
      userId,
      message
    );

    return res.json({
      reply,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to process chat request",
    });
  }
}

