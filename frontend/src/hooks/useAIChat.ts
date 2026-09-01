import { useState, useEffect, useCallback, useRef } from "react";
import { aiService, ChatSessionMeta, ChatMessageItem, SessionDetail } from "../services/aiService";

export function useAIChat(initialSessionId?: string) {
  const [sessions, setSessions] = useState<ChatSessionMeta[]>([]);
  const [activeSession, setActiveSession] = useState<SessionDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [quotaExhausted, setQuotaExhausted] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      setErrorBanner(null);
      const data = await aiService.getSessions(1, 30);
      setSessions(data.sessions);
      return data.sessions;
    } catch (err: any) {
      setErrorBanner(err.response?.data?.message || "Failed to load conversation history.");
      return [];
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const selectSession = useCallback(async (sessionId: string) => {
    try {
      setLoadingMessages(true);
      setErrorBanner(null);
      const [{ session }, msgData] = await Promise.all([
        aiService.getSession(sessionId),
        aiService.getMessages(sessionId, 1, 50),
      ]);
      setActiveSession(session);
      setMessages(msgData.messages);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setErrorBanner("The selected conversation is no longer available.");
        setActiveSession(null);
        setMessages([]);
      } else {
        setErrorBanner(err.response?.data?.message || "Failed to retrieve conversation.");
      }
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadSessions().then((fetched) => {
      if (initialSessionId) {
        selectSession(initialSessionId);
      } else if (fetched.length > 0) {
        selectSession(fetched[0].id);
      }
    });
  }, [loadSessions, initialSessionId, selectSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const startNewSession = async (datasetId?: string, title?: string) => {
    try {
      setErrorBanner(null);
      const { session } = await aiService.createSession({ datasetId, title });
      setSessions((prev) => [session, ...prev]);
      await selectSession(session.id);
      return session;
    } catch (err: any) {
      setErrorBanner(err.response?.data?.message || "Could not create new conversation.");
      return null;
    }
  };

  const handleSendMessage = async (content: string, datasetId?: string) => {
    if (!content.trim() || isSending) return;

    let targetSessionId = activeSession?.id;
    if (!targetSessionId) {
      const newSession = await startNewSession(datasetId, content.substring(0, 40));
      if (!newSession) return;
      targetSessionId = newSession.id;
    }

    const optimisticUserMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsSending(true);
    setErrorBanner(null);

    try {
      const res = await aiService.sendMessage(targetSessionId, {
        content: content.trim(),
        datasetId: datasetId || activeSession?.datasetId || undefined,
      });

      const assistantMsg: ChatMessageItem = {
        id: res.assistantMessageId,
        role: "assistant",
        content: res.reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev.filter((m) => m.id !== optimisticUserMsg.id), { ...optimisticUserMsg, id: res.userMessageId }, assistantMsg]);

      // Update sidebar session title & message counter
      setSessions((prev) =>
        prev.map((s) => (s.id === targetSessionId ? { ...s, messageCount: s.messageCount + 2, updatedAt: new Date().toISOString() } : s))
      );
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 429) {
        setErrorBanner(data?.error === "AI_RATE_LIMIT_EXCEEDED" ? "You are querying too quickly. Please wait a moment." : "Monthly AI quota exhausted for this period.");
        if (data?.error !== "AI_RATE_LIMIT_EXCEEDED") setQuotaExhausted(true);
      } else if (status === 403 && data?.code === "QUOTA_EXHAUSTED") {
        setQuotaExhausted(true);
        setErrorBanner(data.message || "Monthly AI quota reached.");
      } else if (status === 504) {
        setErrorBanner("AI Reasoning Engine timed out. Please retry your question.");
      } else {
        setErrorBanner(data?.message || "Failed to process AI response. Please try again.");
      }

      // Revert optimistic message on persistent failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const renameSession = async (sessionId: string, newTitle: string) => {
    try {
      const { session } = await aiService.renameSession(sessionId, newTitle);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: session.title, updatedAt: session.updatedAt } : s)));
      if (activeSession?.id === sessionId) {
        setActiveSession((prev) => (prev ? { ...prev, title: session.title } : null));
      }
    } catch (err: any) {
      setErrorBanner(err.response?.data?.message || "Failed to rename session.");
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await aiService.deleteSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSession?.id === sessionId) {
        if (remaining.length > 0) {
          selectSession(remaining[0].id);
        } else {
          setActiveSession(null);
          setMessages([]);
        }
      }
    } catch (err: any) {
      setErrorBanner(err.response?.data?.message || "Failed to delete session.");
    }
  };

  return {
    sessions,
    activeSession,
    messages,
    loadingSessions,
    loadingMessages,
    isSending,
    errorBanner,
    quotaExhausted,
    messagesEndRef,
    selectSession,
    startNewSession,
    handleSendMessage,
    renameSession,
    deleteSession,
    refreshSessions: loadSessions,
  };
}



