import { Request, Response } from "express";

import {

  createChatSession,
  getChatSessions,
  getChatMessages,
  deleteChatSession,

} from "../services/chatHistoryService";



export async function createSession(
  req: Request,
  res: Response
) {

  try {

    const userId =
      req.user!.userId;

    const { title } =
      req.body;

    const session =
      await createChatSession(
        userId,
        title || "New Chat"
      );

    res.status(201).json(
      session
    );

  } catch (error) {

    console.error(error);

    res.status(500).json({

      message:
        "Failed to create chat session",

    });

  }

}





export async function getSessions(
  req: Request,
  res: Response
) {

  try {

    const userId =
      req.user!.userId;

    const sessions =
      await getChatSessions(
        userId
      );

    res.json(
      sessions
    );

  } catch (error) {

    console.error(error);

    res.status(500).json({

      message:
        "Failed to fetch chat sessions",

    });

  }

}





export async function getMessages(
  req: Request,
  res: Response
) {

  try {

    const messages =
      await getChatMessages(
        String(req.params.id)
      );

    res.json(
      messages
    );

  } catch (error) {

    console.error(error);

    res.status(500).json({

      message:
        "Failed to fetch chat messages",

    });

  }

}





export async function removeSession(
  req: Request,
  res: Response
) {

  try {

    await deleteChatSession(
      String(req.params.id)
    );

    res.json({

      message:
        "Chat deleted successfully",

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      message:
        "Failed to delete chat",

    });

  }

}

