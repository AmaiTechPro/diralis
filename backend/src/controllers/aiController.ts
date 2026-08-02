import { Request, Response } from "express";
import { askDiralis } from "../services/aiService";

export async function aiController(
  req: Request,
  res: Response
) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required.",
      });
    }

    const reply = await askDiralis(message);

    res.json({
      reply,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "AI request failed.",
    });
  }
}

