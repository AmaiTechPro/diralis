import api from "./api";

export async function getChatSessions() {

  const response =
    await api.get("/chat-history");

  return response.data;

}

export async function createChatSession(
  title: string
) {

  const response =
    await api.post(
      "/chat-history",
      {
        title,
      }
    );

  return response.data;

}

export async function getChatMessages(
  sessionId: string
) {

  const response =
    await api.get(
      `/chat-history/${sessionId}`
    );

  return response.data;

}

export async function deleteChatSession(
  sessionId: string
) {

  await api.delete(
    `/chat-history/${sessionId}`
  );

}

