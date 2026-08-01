export function formatChatResponse(
  response:string
) {


  return {

    reply:
      response.trim(),

    timestamp:
      new Date().toISOString(),

  };

}

