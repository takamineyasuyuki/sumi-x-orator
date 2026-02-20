"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Send, Volume2, VolumeX, MicOff } from "lucide-react";
import ChatBubble from "@/components/ChatBubble";
import MenuCard from "@/components/MenuCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MenuItem {
  name: string;
  category?: string;
  price: number;
  description?: string;
  allergens?: string;
  chefs_note?: string;
  image_url?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  menuItems?: MenuItem[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sendMessageRef = useRef<(text: string) => void>();

  // ------------------------------------------------------------------
  // Init: check Speech API support & wake backend
  // ------------------------------------------------------------------
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);

    // Wake Render backend (cold start can take ~30s)
    fetch(`${API_URL}/health`).catch(() => {});
  }, []);

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "いらっしゃいませ。本日はご来店ありがとうございます。\nメニューについて何でもお気軽にお聞きください。",
      },
    ]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ------------------------------------------------------------------
  // TTS (Text-to-Speech)
  // ------------------------------------------------------------------
  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || typeof window === "undefined") return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const isJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(
        text
      );
      utterance.lang = isJapanese ? "ja-JP" : "en-US";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled]
  );

  // ------------------------------------------------------------------
  // Send message
  // ------------------------------------------------------------------
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

        const res = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), history }),
        });

        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          menuItems:
            data.menu_items?.length > 0 ? data.menu_items : undefined,
        };
        setMessages((prev) => [...prev, aiMsg]);
        speak(data.reply);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "申し訳ございません、接続エラーが発生しました。もう一度お試しください。",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, speak]
  );

  // Keep ref in sync for voice callback
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // ------------------------------------------------------------------
  // Voice recording (STT)
  // ------------------------------------------------------------------
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "ja-JP";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Auto-send voice input after brief delay
      setTimeout(() => {
        const text = inputRef.current?.value || "";
        if (text.trim()) {
          sendMessageRef.current?.(text);
        }
      }, 300);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  // ------------------------------------------------------------------
  // Keyboard: Enter to send (respects IME composition)
  // ------------------------------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <main className="flex flex-col h-[100dvh] max-w-lg mx-auto">
      {/* ---- Header ---- */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <h1 className="text-lg font-light tracking-[0.2em]">SUMI X</h1>
          <p className="text-[10px] text-white/40 tracking-[0.15em] uppercase">
            Orator
          </p>
        </div>
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className="p-2 text-white/40 hover:text-white/80 transition-colors"
          aria-label={ttsEnabled ? "Mute voice" : "Unmute voice"}
        >
          {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </header>

      {/* ---- Messages ---- */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatBubble role={msg.role} content={msg.content} />

            {/* Menu card carousel */}
            {msg.menuItems && msg.menuItems.length > 0 && (
              <div className="menu-carousel flex gap-3 overflow-x-auto py-3 pl-11">
                {msg.menuItems.map((item, i) => (
                  <MenuCard key={i} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
            <div className="space-y-2 flex-1 max-w-[70%]">
              <div className="skeleton h-4 rounded w-3/4" />
              <div className="skeleton h-4 rounded w-1/2" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ---- Input area ---- */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Mic button */}
          {speechSupported && (
            <button
              onClick={toggleRecording}
              className={`relative p-3 rounded-full transition-all ${
                isRecording
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10"
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-red-500/20 recording-pulse" />
              )}
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メニューについてお気軽にどうぞ..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm
                       placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            disabled={isLoading}
          />

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10
                       disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
            aria-label="Send"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </main>
  );
}
