interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#e85d26] flex items-center justify-center flex-shrink-0 text-[10px] text-white font-bold tracking-wider">
          Guu
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
