export type ChatIntent =
  | "SUMMARY"
  | "HEALTH"
  | "INSIGHTS"
  | "WARNINGS"
  | "RECOMMENDATIONS"
  | "QUALITY"
  | "FORECAST"
  | "GENERAL";



export function detectChatIntent(
  message: string
): ChatIntent {


  const text =
    message
      .toLowerCase()
      .trim();



  if (
    text.includes("summary") ||
    text.includes("summarize") ||
    text.includes("overview")
  ) {

    return "SUMMARY";

  }



  if (
    text.includes("health") ||
    text.includes("performance")
  ) {

    return "HEALTH";

  }



  if (
    text.includes("insight") ||
    text.includes("trend") ||
    text.includes("pattern")
  ) {

    return "INSIGHTS";

  }



  if (
    text.includes("warning") ||
    text.includes("risk") ||
    text.includes("problem")
  ) {

    return "WARNINGS";

  }



  if (
    text.includes("recommend") ||
    text.includes("improve") ||
    text.includes("should")
  ) {

    return "RECOMMENDATIONS";

  }



  if (
    text.includes("quality") ||
    text.includes("missing") ||
    text.includes("duplicate")
  ) {

    return "QUALITY";

  }



  if (
    text.includes("forecast") ||
    text.includes("future") ||
    text.includes("predict")
  ) {

    return "FORECAST";

  }



  return "GENERAL";

}

