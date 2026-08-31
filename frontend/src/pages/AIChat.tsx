import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { sendMessage } from "../services/chatService";
import { getChatSessions } from "../services/chatHistoryService";
import { Bot, User, Send, MessageSquare } from "lucide-react";
import FeatureGate from "../components/billing/FeatureGate";
import { useEntitlement } from "../hooks/useEntitlement";

type ChatMessage = {
  sender: "user" | "ai";
  text: string;
  time: string;
};

type ChatSession = {
  id: string;
  title: string;
};

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "Hello 👋 I'm the Diralis AI Assistant. Ask me anything about your business data and uploaded datasets.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setSessions] = useState<ChatSession[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    getLimit,
    getUsage,
    isUsageExceeded,
    currentTier,
    refresh: refreshEntitlements,
  } = useEntitlement();

  const aiLimit = getLimit("aiRequestsPerMonth");
  const aiUsage = getUsage("aiRequestsPerMonth");
  const isQuotaExceeded = isUsageExceeded("aiRequestsPerMonth");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await getChatSessions();
        setSessions(data);
      } catch (error) {
        console.error("Failed to load chat sessions", error);
      }
    }
    loadSessions();
  }, []);

  async function handleSend(question?: string) {
    const message = question ?? input;
    if (!message.trim()) return;

    if (isQuotaExceeded) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `⚠️ You have reached your monthly AI request limit of ${aiLimit} on the ${currentTier} plan. Please upgrade your plan in the Billing portal to continue asking questions.`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: message,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await sendMessage(message);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: response.reply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      await refreshEntitlements();
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, I couldn't process your request.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }

    setLoading(false);
  }

  const prompts = [
    "Summarize my dataset",
    "Business health",
    "Show AI insights",
    "Show warnings",
    "Show recommendations",
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">AI Chat</h1>
          <p className="mt-2 text-slate-400">
            Chat interactively with your business data and models.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <MessageSquare size={15} className="text-cyan-400" />
            <span>
              AI Requests:{" "}
              <strong className="text-white">
                {aiUsage}
                {aiLimit !== null ? ` / ${aiLimit}` : " (Unlimited)"}
              </strong>
            </span>
          </div>
          <span className="h-4 w-px bg-slate-800" />
          <Link
            to="/billing"
            className="text-[11px] font-semibold text-cyan-400 hover:underline"
          >
            Plan: {currentTier}
          </Link>
        </div>
      </div>

      {isQuotaExceeded && (
        <div className="mt-4">
          <FeatureGate
            resourceLimit="aiRequestsPerMonth"
            fallbackMode="banner"
            upgradeMessage={`You have reached your limit of ${aiLimit} AI requests this month on the ${currentTier} plan.`}
          >
            <div />
          </FeatureGate>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            disabled={isQuotaExceeded}
            className="rounded-full border border-cyan-500/40 bg-slate-900/50 px-4 py-2 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900">
        <div className="h-[500px] overflow-y-auto space-y-5 p-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.sender === "ai" && (
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                  message.sender === "user"
                    ? "bg-cyan-500 text-slate-950 font-medium"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>
                <p className="mt-1 text-right text-[10px] opacity-60">
                  {message.time}
                </p>
              </div>

              {message.sender === "user" && (
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-cyan-400 shrink-0">
                  <User size={18} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
                <Bot size={18} />
              </div>
              <div className="rounded-2xl bg-slate-800 px-4 py-3 text-xs text-slate-400 animate-pulse">
                Analyzing dataset and generating insights...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="flex gap-3 border-t border-slate-800 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            disabled={isQuotaExceeded}
            placeholder={
              isQuotaExceeded
                ? "Monthly AI request limit reached. Upgrade to continue."
                : "Ask about your dataset, revenue projections, or business health..."
            }
            className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || isQuotaExceeded}
            className="flex items-center justify-center rounded-xl bg-cyan-500 px-5 text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}


