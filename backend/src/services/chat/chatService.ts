import { buildChatContext } from "./chatContextBuilder";

import { buildChatPrompt } from "./chatPromptBuilder";

import { formatChatResponse } from "./chatResponseFormatter";

import { detectChatIntent } from "./chatIntentDetector";

import { buildDecisionResponse } from "./decisionResponseBuilder";



export async function generateChatResponse(
  userId: string,
  message: string
) {


  const context =
    await buildChatContext(
      userId
    );



  /**
   * Build future LLM prompt.
   * Currently prepared for OpenAI/Gemini integration.
   */
  const prompt =
    buildChatPrompt(
      context,
      message
    );



  console.log(
    "Diralis AI Prompt:",
    prompt
  );



  /**
   * Understand what the user wants.
   */
  const intent =
    detectChatIntent(
      message
    );



  /**
   * Generate business decision response.
   */
  const response =
    buildDecisionResponse(
      intent,
      context
    );



  /**
   * Standardize API response.
   */
  return formatChatResponse(
    response
  );

}

