"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  feedback?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TrainingPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi there! I just walked in, this place looks really cool. Is this an izakaya?",
      },
    ]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Send
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const history = messages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch(`${API_URL}/api/chat/train`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), history }),
        });

        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.customer_reply,
          feedback: data.feedback_to_staff || undefined,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setTurnCount((prev) => prev + 1);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Sorry, something went wrong. Let's try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  // Reset
  const resetSession = () => {
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content:
          "Hi there! I just walked in, this place looks really cool. Is this an izakaya?",
      },
    ]);
    setTurnCount(0);
    setInput("");
  };

  // Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <main className="flex flex-col h-[100dvh] max-w-lg mx-auto bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <h1 className="text-lg font-light tracking-[0.2em] text-white">
            SUMI X
          </h1>
          <p className="text-[10px] text-blue-400/60 tracking-[0.15em] uppercase">
            Training Mode
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30">
            Turn {turnCount}/3
          </span>
          <button
            onClick={resetSession}
            className="p-2 text-white/30 hover:text-blue-400 transition-colors"
            title="New customer"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            {/* Chat bubble */}
            <div
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-[10px] text-blue-400 font-mono">
                  C
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-500/15 text-white rounded-2xl rounded-br-sm"
                    : "bg-white/[0.04] border border-white/[0.08] text-white/90 rounded-2xl rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>

            {/* Feedback card */}
            {msg.feedback && (
              <div className="ml-11 mt-3 p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
                <p className="text-[10px] text-blue-400 font-bold tracking-wider uppercase mb-2">
                  Senior Staff Feedback
                </p>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                  {msg.feedback}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Loading */}
        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex-shrink-0" />
            <div className="space-y-2 flex-1 max-w-[70%]">
              <div className="h-4 rounded w-3/4 bg-white/5 animate-pulse" />
              <div className="h-4 rounded w-1/2 bg-white/5 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Hint */}
      <div className="px-5 py-2">
        <p className="text-[10px] text-white/20 text-center">
          Speak English as if you are serving a real customer at Guu.
        </p>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your English response..."
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-full px-5 py-3 text-sm text-white
                       placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-full bg-blue-500/15 text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/25
                       disabled:opacity-30 transition-all"
            aria-label="Send"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </main>
  );
}
