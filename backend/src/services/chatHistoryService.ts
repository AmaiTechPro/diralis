import prisma from "../lib/prisma";

export async function createChatSession(
  userId: string,
  title: string
) {

  return prisma.chatSession.create({

    data: {
      userId,
      title,
    },

  });

}

export async function getChatSessions(
  userId: string
) {

  return prisma.chatSession.findMany({

    where: {
      userId,
    },

    orderBy: {
      updatedAt: "desc",
    },

  });

}

export async function getChatMessages(
  sessionId: string
) {

  return prisma.chatMessage.findMany({

    where: {
      sessionId,
    },

    orderBy: {
      createdAt: "asc",
    },

  });

}

export async function addMessage(
  sessionId: string,
  role: string,
  content: string
) {

  return prisma.chatMessage.create({

    data: {
      sessionId,
      role,
      content,
    },

  });

}

export async function deleteChatSession(
  sessionId: string
) {

  return prisma.chatSession.delete({

    where: {
      id: sessionId,
    },

  });

}


