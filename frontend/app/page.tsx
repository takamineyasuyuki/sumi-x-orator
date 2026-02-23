"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Mic, Send, MicOff, Globe, Star } from "lucide-react";
import ChatBubble from "@/components/ChatBubble";
import MenuCard from "@/components/MenuCard";
import DrunkJohn from "@/components/DrunkJohn";

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
interface UIStrings {
  welcome: string;
  placeholder: string;
  ratingAsk: string;
  ratingThanks: string;
  talkThemeLabel: string;
  rateLimitError: string;
  apiError: string;
  drunkTitle: string;
  drunkSubtitle: string;
  drunkHint: string;
}

const I18N: Record<string, UIStrings> = {
  "en-US": {
    welcome:
      "Hey! Welcome to Guu! I'm John, your digital concierge!\nI'll handle all the menu info - you just enjoy the vibes and the amazing crew here. What are you in the mood for?",
    placeholder: "Ask me about the menu...",
    ratingAsk: "How was it?",
    ratingThanks: "Thank you!",
    talkThemeLabel: "This Week's Talk Theme",
    rateLimitError: "Thanks for chatting! Please enjoy the rest with our amazing staff!",
    apiError: "Oops! John drank too much sake! Please call a human staff member!",
    drunkTitle: "Oops! John drank too much sake and is taking a nap!",
    drunkSubtitle: "Please call a human staff member!",
    drunkHint: "(John is recovering... try again in a moment)",
  },
  "ja-JP": {
    welcome:
      "いらっしゃい！Guuへようこそ！僕はジョン、デジタルコンシェルジュだよ！\nメニューのことは僕に任せて、君は最高のスタッフとの時間を楽しんで！何が気になる？",
    placeholder: "メニューについて聞いてね...",
    ratingAsk: "どうだった？",
    ratingThanks: "ありがとう！",
    talkThemeLabel: "今週のトークテーマ",
    rateLimitError: "ご利用ありがとうございました。続きはお店でお楽しみください！",
    apiError: "ジョンが飲みすぎてダウン！スタッフを呼んでね！",
    drunkTitle: "ジョンが日本酒を飲みすぎて寝ちゃった！",
    drunkSubtitle: "スタッフを呼んでください！",
    drunkHint: "（ジョン回復中...少し待ってね）",
  },
  "ko-KR": {
    welcome:
      "안녕하세요! Guu에 오신 걸 환영해요! 저는 John, 디지털 컨시어지예요!\n메뉴는 제가 안내할게요 - 멋진 스태프와 함께 즐거운 시간 보내세요! 뭐가 끌리세요?",
    placeholder: "메뉴에 대해 물어보세요...",
    ratingAsk: "어떠셨어요?",
    ratingThanks: "감사합니다!",
    talkThemeLabel: "이번 주 토크 테마",
    rateLimitError: "이용해 주셔서 감사합니다! 나머지는 스태프와 함께 즐겨주세요!",
    apiError: "이런! John이 술을 너무 많이 마셨어요! 스태프를 불러주세요!",
    drunkTitle: "이런! John이 사케를 너무 마시고 잠들었어요!",
    drunkSubtitle: "스태프를 불러주세요!",
    drunkHint: "(John 회복 중... 잠시만 기다려주세요)",
  },
  "zh-CN": {
    welcome:
      "嗨！欢迎来到Guu！我是John，您的数字礼宾！\n菜单的事交给我，您尽管享受这里的氛围和超棒的工作人员！想吃点什么？",
    placeholder: "问我关于菜单的问题...",
    ratingAsk: "感觉怎么样？",
    ratingThanks: "谢谢！",
    talkThemeLabel: "本周聊天主题",
    rateLimitError: "感谢您的使用！请继续享受店内的美好时光！",
    apiError: "哎呀！John喝太多清酒了！请叫工作人员！",
    drunkTitle: "哎呀！John喝太多清酒睡着了！",
    drunkSubtitle: "请叫工作人员！",
    drunkHint: "（John恢复中...请稍等）",
  },
  "es-ES": {
    welcome:
      "Hola! Bienvenido a Guu! Soy John, tu concierge digital!\nYo me encargo del menu - tu disfruta del ambiente y del increible equipo. Que te apetece?",
    placeholder: "Preguntame sobre el menu...",
    ratingAsk: "Que tal estuvo?",
    ratingThanks: "Gracias!",
    talkThemeLabel: "Tema de conversacion de la semana",
    rateLimitError: "Gracias por chatear! Disfruta el resto con nuestro increible equipo!",
    apiError: "Ups! John bebio demasiado sake! Llama a un miembro del equipo!",
    drunkTitle: "Ups! John bebio demasiado sake y se quedo dormido!",
    drunkSubtitle: "Por favor llama a un miembro del equipo!",
    drunkHint: "(John se esta recuperando... intenta en un momento)",
  },
  "pt-BR": {
    welcome:
      "Oi! Bem-vindo ao Guu! Eu sou o John, seu concierge digital!\nDeixa o cardapio comigo - voce so precisa curtir a vibe e a equipe incrivel daqui. O que te anima?",
    placeholder: "Pergunte sobre o cardapio...",
    ratingAsk: "O que achou?",
    ratingThanks: "Obrigado!",
    talkThemeLabel: "Tema da conversa da semana",
    rateLimitError: "Obrigado por conversar! Aproveite o resto com nossa equipe incrivel!",
    apiError: "Ops! John bebeu sake demais! Chame um membro da equipe!",
    drunkTitle: "Ops! John bebeu sake demais e caiu no sono!",
    drunkSubtitle: "Por favor chame um membro da equipe!",
    drunkHint: "(John esta se recuperando... tente novamente em um momento)",
  },
};

const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "ja-JP", label: "日本語" },
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
  const [speechSupported, setSpeechSupported] = useState(false);
  const [sttLang, setSttLang] = useState("en-US");
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

  const t = useMemo(() => I18N[sttLang] || I18N["en-US"], [sttLang]);

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

  // Welcome message on mount
  useEffect(() => {
    setMessages([{ id: "welcome", role: "assistant", content: t.welcome }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No-op: welcome message stays in original language, chat history preserved

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
            lang: sttLang,
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
      } catch (err) {
        const isRateLimit = err instanceof Error && err.message === "RATE_LIMIT";
        if (!isRateLimit) setBackendDown(true);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: isRateLimit ? t.rateLimitError : t.apiError,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, t]
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
        <DrunkJohn title={t.drunkTitle} subtitle={t.drunkSubtitle} hint={t.drunkHint} />
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
              <p className="text-[9px] text-[#8B7355] uppercase tracking-wider font-medium">{t.talkThemeLabel}</p>
              <p className="text-sm text-[#3D2B1F] font-medium">{talkTheme}</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- Rating ---- */}
      {userMessageCount >= 3 && !rated && (
        <div className="flex items-center justify-center gap-1 py-2 border-t border-[#D4C4AE]">
          <span className="text-[11px] text-[#8B7355] mr-2">{t.ratingAsk}</span>
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
          <span className="text-[11px] text-[#8B7355]">{t.ratingThanks}</span>
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
            placeholder={t.placeholder}
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
