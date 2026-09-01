import React, { useState, useRef, useEffect } from "react";
import { useAIChat } from "../hooks/useAIChat";
import FeatureGate from "../components/billing/FeatureGate";
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit3,
  Send,
  Database,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

const SUGGESTED_PROMPTS = [
  "What are the top 3 revenue driving trends in this dataset?",
  "Identify anomalies or underperforming segments.",
  "Calculate the growth rate across quarters.",
  "Provide an executive summary of key statistical findings.",
];

export const AIChatPage: React.FC = () => {
  const {
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
  } = useAIChat();

  const [inputContent, setInputContent] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const onSend = (textToSend?: string) => {
    const text = textToSend || inputContent;
    if (!text.trim() || isSending) return;
    handleSendMessage(text);
    setInputContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputContent]);

  return (
    <FeatureGate
      feature="aiChat"
      fallbackMode="blur"
      upgradeMessage="Intelligent multi-turn conversations grounded in your dataset models require a Pro or higher tier."
    >
      <div className="flex h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`absolute md:static z-50 flex flex-col w-72 h-full bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                startNewSession();
                setMobileSidebarOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-semibold transition shadow"
            >
              <Plus size={18} />
              <span>New Conversation</span>
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden ml-2 p-2 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {loadingSessions ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading conversations...</div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">No previous conversations.</div>
            ) : (
              sessions.map((s) => {
                const isActive = activeSession?.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm transition ${
                      isActive ? "bg-slate-800 text-white font-medium shadow-inner" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                    onClick={() => {
                      selectSession(s.id);
                      setMobileSidebarOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare size={16} className="flex-shrink-0 text-slate-400" />
                      {editingSessionId === s.id ? (
                        <input
                          type="text"
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          onBlur={() => {
                            if (editTitleValue.trim()) renameSession(s.id, editTitleValue);
                            setEditingSessionId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (editTitleValue.trim()) renameSession(s.id, editTitleValue);
                              setEditingSessionId(null);
                            }
                          }}
                          autoFocus
                          className="bg-slate-950 text-white px-2 py-0.5 rounded border border-cyan-500 w-full text-xs outline-none"
                        />
                      ) : (
                        <span className="truncate">{s.title}</span>
                      )}
                    </div>

                    <div className="hidden group-hover:flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(s.id);
                          setEditTitleValue(s.title);
                        }}
                        className="p-1 hover:text-white text-slate-500"
                        title="Rename"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete this conversation and its messages?")) {
                            deleteSession(s.id);
                          }
                        }}
                        className="p-1 hover:text-rose-400 text-slate-500"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Conversation Container */}
        <main className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
          {/* Header Bar */}
          <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 text-slate-400 hover:text-white"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="font-semibold text-slate-100 flex items-center gap-2">
                  <Sparkles size={18} className="text-cyan-400" />
                  {activeSession?.title || "AI Business Analyst"}
                </h1>
                {activeSession?.dataset && (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300 mt-0.5">
                    <Database size={13} />
                    <span>Grounded in: <strong>{activeSession.dataset.originalName}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Warning/Error Banner */}
          {errorBanner && (
            <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 text-rose-400 text-sm flex items-center justify-between">
              <span>{errorBanner}</span>
              {quotaExhausted && (
                <a href="/billing" className="underline font-semibold ml-4 hover:text-rose-300">
                  Upgrade Plan
                </a>
              )}
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Retrieving message history...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center space-y-6 py-12">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Ask anything about your metrics</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Diralis AI dynamically reasons over statistical models, distributions, and schema anomalies.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => onSend(prompt)}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 text-xs text-slate-300 transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                        isUser
                          ? "bg-cyan-500 text-slate-950 font-medium rounded-br-sm shadow-md"
                          : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className={`text-[10px] mt-2 opacity-50 ${isUser ? "text-right" : "text-left"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-bl-sm px-5 py-3.5 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Diralis AI is analyzing dataset context...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <footer className="p-4 border-t border-slate-800 bg-slate-900/30">
            <div className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-900 border border-slate-800 focus-within:border-cyan-500 rounded-2xl p-2 transition">
              <textarea
                ref={textareaRef}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about distributions, correlations, or performance indicators... (Shift+Enter for newline)"
                rows={1}
                disabled={isSending || quotaExhausted}
                className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-100 placeholder-slate-500 px-3 py-2 max-h-40"
              />
              <button
                onClick={() => onSend()}
                disabled={!inputContent.trim() || isSending || quotaExhausted}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold transition flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </footer>
        </main>
      </div>
    </FeatureGate>
  );
};

export default AIChatPage;

