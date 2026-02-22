interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-10 h-10 flex-shrink-0">
          {/* John: ochoko (sake cup) in oversized Guu green T-shirt */}
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Green T-shirt body */}
            <path d="M8 24 C8 20 12 18 20 18 C28 18 32 20 32 24 L32 36 C32 38 30 40 20 40 C10 40 8 38 8 36 Z" fill="#4CAF50" />
            {/* T-shirt sleeves */}
            <path d="M8 24 L2 28 L6 30 L10 26" fill="#4CAF50" />
            <path d="M32 24 L38 28 L34 30 L30 26" fill="#4CAF50" />
            {/* Ochoko cup head (white, round) */}
            <ellipse cx="20" cy="14" rx="11" ry="10" fill="#FAFAFA" stroke="#E0D5C8" strokeWidth="0.8" />
            {/* Eyes (cute, round) */}
            <circle cx="15" cy="13" r="1.8" fill="#2a1a0a" />
            <circle cx="25" cy="13" r="1.8" fill="#2a1a0a" />
            {/* Eye shine */}
            <circle cx="15.7" cy="12.3" r="0.6" fill="white" />
            <circle cx="25.7" cy="12.3" r="0.6" fill="white" />
            {/* Smile */}
            <path d="M16 17 Q20 20 24 17" stroke="#2a1a0a" strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Blush */}
            <ellipse cx="12" cy="16" rx="2" ry="1" fill="#FFB3B3" opacity="0.5" />
            <ellipse cx="28" cy="16" rx="2" ry="1" fill="#FFB3B3" opacity="0.5" />
            {/* T-shirt collar */}
            <path d="M15 19 Q20 21 25 19" stroke="#388E3C" strokeWidth="0.8" fill="none" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#e85d26]/20 text-[#f5ebe0] rounded-2xl rounded-br-sm"
            : "bg-[#2a1a0a] border border-[#e85d26]/15 text-[#f5ebe0]/90 rounded-2xl rounded-bl-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
