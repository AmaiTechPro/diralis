import api from "./api";

export async function sendMessage(
  message: string
) {
  const response = await api.post(
    "/ai",
    {
      message,
    }
  );

  return {
    reply: response.data.reply,
    timestamp: new Date().toISOString(),
  };
}

