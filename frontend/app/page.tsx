"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Send, Volume2, VolumeX, MicOff, Globe, Star } from "lucide-react";
import ChatBubble from "@/components/ChatBubble";
import MenuCard from "@/components/MenuCard";
import DrunkJohn from "@/components/DrunkJohn";

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

interface AvailabilityItem {
  メニュー名: string;
  提供中: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  menuItems?: MenuItem[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const POLL_INTERVAL = 20_000;

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
  const [backendDown, setBackendDown] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [talkTheme, setTalkTheme] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sendMessageRef = useRef<(text: string) => void>();

  // ------------------------------------------------------------------
  // Check if a menu item is currently available
  // ------------------------------------------------------------------
  const isItemAvailable = useCallback(
    (name: string) => {
      if (availability.length === 0) return true;
      const found = availability.find((a) => a.メニュー名 === name);
      return found ? found.提供中 : true;
    },
    [availability]
  );

  // ------------------------------------------------------------------
  // Init
  // ------------------------------------------------------------------
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);

    fetch(`${API_URL}/health`)
      .then((r) => { if (!r.ok) setBackendDown(true); })
      .catch(() => setBackendDown(true));

    // Fetch talk theme
    fetch(`${API_URL}/api/config/talk-theme`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.theme) setTalkTheme(data.theme); })
      .catch(() => {});
  }, []);

  // ------------------------------------------------------------------
  // Polling
  // ------------------------------------------------------------------
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/menu/availability`);
        if (res.ok) {
          const data = await res.json();
          setAvailability(data.items);
          setBackendDown(false);
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hey! Welcome to Guu! I'm John, your digital concierge!\nI'll handle all the menu info - you just enjoy the vibes and the amazing crew here. What are you in the mood for?",
      },
    ]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ------------------------------------------------------------------
  // TTS
  // ------------------------------------------------------------------
  const speak = useCallback(
    async (text: string) => {
      if (!ttsEnabled) return;
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
  // Send message (with energy level)
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

        // Count drink-related messages for energy scaling
        const allTexts = history.map((m) => m.content).join(" ") + " " + text;
        const drinkKeywords = /beer|sake|shochu|cocktail|wine|sangria|highball|draft|sapporo|asahi|ビール|酒|焼酎|カクテル|ハイボール|乾杯/gi;
        const drinkMentions = (allTexts.match(drinkKeywords) || []).length;
        const messageCount = history.length;

        const res = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history,
            energy_context: { message_count: messageCount, drink_mentions: drinkMentions },
          }),
        });

        if (res.status === 429) throw new Error("RATE_LIMIT");
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
        setBackendDown(false);
        speak(data.reply);
      } catch (err) {
        const isRateLimit = err instanceof Error && err.message === "RATE_LIMIT";
        if (!isRateLimit) setBackendDown(true);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: isRateLimit
              ? "ご利用ありがとうございました。続きはお店でお楽しみください。"
              : "Oops! John drank too much sake! Please call a human staff member!",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, speak]
  );

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // ------------------------------------------------------------------
  // Voice recording
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
      setTimeout(() => {
        const text = inputRef.current?.value || "";
        if (text.trim()) sendMessageRef.current?.(text);
      }, 300);
    };
    recognition.onerror = () => setIsRecording(false);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ------------------------------------------------------------------
  // Render: Drunk John
  // ------------------------------------------------------------------
  if (backendDown && messages.length <= 1) {
    return (
      <main className="flex flex-col h-[100dvh] max-w-lg mx-auto">
        <header className="flex items-center justify-center px-5 py-4 border-b border-[#D4C4AE]">
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-[0.15em] text-[#3D2B1F]">Guu Original</h1>
            <p className="text-[10px] text-[#8B7355] tracking-[0.15em] uppercase">Orator</p>
          </div>
        </header>
        <DrunkJohn />
      </main>
    );
  }

  // ------------------------------------------------------------------
  // Render: Main
  // ------------------------------------------------------------------
  return (
    <main className="flex flex-col h-[100dvh] max-w-lg mx-auto">
      {/* ---- Header ---- */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-[#D4C4AE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D4C4AE]">
            <img src="/john.jpg" alt="John" className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-[0.1em] text-[#3D2B1F]">Guu Original</h1>
            <p className="text-[9px] text-[#8B7355] tracking-[0.15em] uppercase">Orator</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-[#8B7355] hover:text-[#3D2B1F] transition-colors"
            >
              <Globe size={14} />
              <span>{LANGUAGES.find((l) => l.code === sttLang)?.label}</span>
            </button>
            {showLangPicker && (
              <div className="absolute right-0 top-full mt-1 bg-[#FFF9F0] border border-[#D4C4AE] rounded-lg py-1 z-50 min-w-[120px] shadow-md">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setSttLang(lang.code); setShowLangPicker(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      sttLang === lang.code
                        ? "text-[#3D2B1F] bg-[#B8D435]/15 font-medium"
                        : "text-[#8B7355] hover:text-[#3D2B1F] hover:bg-[#EDE4D8]"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="p-2 text-[#8B7355] hover:text-[#3D2B1F] transition-colors"
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
            {msg.menuItems && msg.menuItems.length > 0 && (
              <div className="menu-carousel flex gap-3 overflow-x-auto py-3 pl-12">
                {msg.menuItems.map((item, i) => (
                  <MenuCard key={i} item={item} soldOut={!isItemAvailable(item.メニュー名)} />
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-[#EDE4D8] flex-shrink-0" />
            <div className="space-y-2 flex-1 max-w-[70%]">
              <div className="skeleton h-4 rounded w-3/4" />
              <div className="skeleton h-4 rounded w-1/2" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ---- Talk Theme ---- */}
      {talkTheme && (
        <div className="px-4 py-2 border-t border-[#D4C4AE]">
          <div className="bg-[#B8D435]/15 border border-[#B8D435]/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-[#B8D435] text-base flex-shrink-0">&#128172;</span>
            <div>
              <p className="text-[9px] text-[#8B7355] uppercase tracking-wider font-medium">This Week's Talk Theme</p>
              <p className="text-sm text-[#3D2B1F] font-medium">{talkTheme}</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- Rating ---- */}
      {userMessageCount >= 3 && !rated && (
        <div className="flex items-center justify-center gap-1 py-2 border-t border-[#D4C4AE]">
          <span className="text-[11px] text-[#8B7355] mr-2">How was it?</span>
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
                    ? "text-[#B8D435] fill-[#B8D435]"
                    : "text-[#D4C4AE]"
                }
              />
            </button>
          ))}
        </div>
      )}
      {rated && (
        <div className="flex items-center justify-center py-2 border-t border-[#D4C4AE]">
          <span className="text-[11px] text-[#8B7355]">Thank you!</span>
        </div>
      )}

      {/* ---- Input ---- */}
      <div className="border-t border-[#D4C4AE] px-4 py-3">
        <div className="flex items-center gap-2">
          {speechSupported && (
            <button
              onClick={toggleRecording}
              className={`relative p-3 rounded-full transition-all ${
                isRecording
                  ? "bg-red-500/15 text-red-500"
                  : "bg-[#EDE4D8] text-[#8B7355] hover:text-[#3D2B1F]"
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-red-500/10 recording-pulse" />
              )}
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about the menu..."
            className="flex-1 bg-[#FFF9F0] border border-[#D4C4AE] rounded-full px-5 py-3 text-sm text-[#3D2B1F]
                       placeholder:text-[#8B7355]/50 focus:outline-none focus:border-[#B8D435] transition-colors"
            disabled={isLoading}
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-full bg-[#B8D435] text-white hover:bg-[#A5C02E]
                       disabled:opacity-30 transition-all shadow-sm"
            aria-label="Send"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </main>
  );
}
