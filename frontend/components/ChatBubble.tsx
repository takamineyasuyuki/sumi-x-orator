interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-[10px] text-white/50 tracking-wider">
          墨
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-white/10 text-white rounded-2xl rounded-br-sm"
            : "bg-white/[0.03] border border-white/[0.06] text-white/90 rounded-2xl rounded-bl-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
