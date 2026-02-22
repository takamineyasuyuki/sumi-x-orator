"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Send, Volume2, VolumeX, MicOff, Globe, Star } from "lucide-react";
import ChatBubble from "@/components/ChatBubble";
import MenuCard from "@/components/MenuCard";

const LANGUAGES = [
  { code: "ja-JP", label: "日本語" },
  { code: "en-US", label: "English" },
  { code: "ko-KR", label: "한국어" },
  { code: "zh-CN", label: "中文" },
  { code: "es-ES", label: "Español" },
  { code: "pt-BR", label: "Português" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MenuItem {
  メニュー名: string;
  カテゴリー?: string;
  価格: number;
  "魅力・特徴"?: string;
  "アレルギー・注意"?: string;
  担当シェフ?: string;
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
  const [sttLang, setSttLang] = useState("ja-JP");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [rated, setRated] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

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
          "Hey! Welcome to Guu! I'm John, your digital hype man!\nI'll get you pumped about the menu, and the awesome crew here will take your order. Let's gooo!",
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
    async (text: string) => {
      if (!ttsEnabled) return;

      // Strip URLs for natural speech
      const spokenText = text.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
      if (!spokenText) return;

      const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(spokenText);
      const hasKorean = /[\uac00-\ud7af\u1100-\u11ff]/.test(text);
      const hasChinese = /[\u4e00-\u9fff]/.test(text) && !hasJapanese;
      const lang = hasJapanese
        ? "ja-JP"
        : hasKorean
        ? "ko-KR"
        : hasChinese
        ? "zh-CN"
        : sttLang === "es-ES"
        ? "es-ES"
        : sttLang === "pt-BR"
        ? "pt-BR"
        : "en-US";

      try {
        const res = await fetch(`${API_URL}/api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: spokenText, lang }),
        });
        if (!res.ok) throw new Error("TTS API error");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.play();
      } catch {
        // Fallback: browser built-in TTS
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = lang;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    },
    [ttsEnabled, sttLang]
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

        if (res.status === 429) {
          throw new Error("RATE_LIMIT");
        }
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
      } catch (err) {
        const isRateLimit = err instanceof Error && err.message === "RATE_LIMIT";
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: isRateLimit
              ? "ご利用ありがとうございました。続きはお店でお楽しみください。"
              : "申し訳ございません、接続エラーが発生しました。もう一度お試しください。",
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
    recognition.lang = sttLang;

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
  }, [isRecording, sttLang]);

  // ------------------------------------------------------------------
  // Rating
  // ------------------------------------------------------------------
  const submitRating = async (rating: number) => {
    setRated(true);
    const msgCount = messages.filter((m) => m.id !== "welcome").length;
    try {
      await fetch(`${API_URL}/api/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message_count: msgCount, lang: sttLang }),
      });
    } catch {}
  };

  const userMessageCount = messages.filter((m) => m.role === "user").length;

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
      <header className="flex items-center justify-between px-5 py-4 border-b border-[#e85d26]/15">
        <div>
          <h1 className="text-lg font-bold tracking-[0.15em] text-[#e85d26]">Guu Original</h1>
          <p className="text-[10px] text-[#f5ebe0]/40 tracking-[0.15em] uppercase">
            Orator
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-[#f5ebe0]/40 hover:text-[#e85d26] transition-colors"
            >
              <Globe size={14} />
              <span>{LANGUAGES.find((l) => l.code === sttLang)?.label}</span>
            </button>
            {showLangPicker && (
              <div className="absolute right-0 top-full mt-1 bg-[#2a1a0a] border border-[#e85d26]/20 rounded-lg py-1 z-50 min-w-[120px]">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSttLang(lang.code);
                      setShowLangPicker(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      sttLang === lang.code
                        ? "text-[#e85d26] bg-[#e85d26]/10"
                        : "text-[#f5ebe0]/60 hover:text-[#e85d26] hover:bg-[#e85d26]/5"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* TTS toggle */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="p-2 text-[#f5ebe0]/40 hover:text-[#e85d26] transition-colors"
            aria-label={ttsEnabled ? "Mute voice" : "Unmute voice"}
          >
            {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
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
            <div className="w-10 h-10 rounded-full bg-[#4CAF50]/20 flex-shrink-0" />
            <div className="space-y-2 flex-1 max-w-[70%]">
              <div className="skeleton h-4 rounded w-3/4" />
              <div className="skeleton h-4 rounded w-1/2" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ---- Rating ---- */}
      {userMessageCount >= 3 && !rated && (
        <div className="flex items-center justify-center gap-1 py-2 border-t border-[#e85d26]/15">
          <span className="text-[11px] text-[#f5ebe0]/30 mr-2">How was it?</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => submitRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-1 transition-colors"
            >
              <Star
                size={20}
                className={
                  star <= hoveredStar
                    ? "text-[#e85d26] fill-[#e85d26]"
                    : "text-[#f5ebe0]/20"
                }
              />
            </button>
          ))}
        </div>
      )}
      {rated && (
        <div className="flex items-center justify-center py-2 border-t border-[#e85d26]/15">
          <span className="text-[11px] text-[#f5ebe0]/30">Thank you!</span>
        </div>
      )}

      {/* ---- Input area ---- */}
      <div className="border-t border-[#e85d26]/15 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Mic button */}
          {speechSupported && (
            <button
              onClick={toggleRecording}
              className={`relative p-3 rounded-full transition-all ${
                isRecording
                  ? "bg-red-500/20 text-red-400"
                  : "bg-[#e85d26]/10 text-[#f5ebe0]/40 hover:text-[#e85d26] hover:bg-[#e85d26]/20"
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
            className="flex-1 bg-[#2a1a0a] border border-[#e85d26]/15 rounded-full px-5 py-3 text-sm text-[#f5ebe0]
                       placeholder:text-[#f5ebe0]/25 focus:outline-none focus:border-[#e85d26]/40 transition-colors"
            disabled={isLoading}
          />

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-full bg-[#e85d26]/15 text-[#e85d26]/60 hover:text-[#e85d26] hover:bg-[#e85d26]/25
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
