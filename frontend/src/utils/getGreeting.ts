export interface Greeting {
  text: string;
  emoji: string;
}

export function getGreeting(): Greeting {
  const hour = new Date().getHours();

  if (hour < 12) {
    return {
      text: "Good morning",
      emoji: "🌅",
    };
  }

  if (hour < 18) {
    return {
      text: "Good afternoon",
      emoji: "☀️",
    };
  }

  return {
    text: "Good evening",
    emoji: "🌙",
  };
}


