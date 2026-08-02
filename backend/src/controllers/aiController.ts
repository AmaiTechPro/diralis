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
    } catch (error: any) {
    console.error(error);


    if (
      error?.code === "credit_balance_exhausted"
    ) {

      return res.status(503).json({
        message:
          "Diralis AI is temporarily unavailable. AI credits need to be updated.",
      });

    }


    res.status(500).json({
      message:
        "AI request failed. Please try again.",
    });

  }
}

