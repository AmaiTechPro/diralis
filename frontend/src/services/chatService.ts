import api from "./api";

export async function sendMessage(
  message: string
) {

  const response =
    await api.post(
      "/chat",
      {
        message,
      }
    );


  return {
    reply:
      response.data.reply.reply ??
      response.data.reply,

    timestamp:
      response.data.reply.timestamp ??
      new Date().toISOString(),
  };

}

