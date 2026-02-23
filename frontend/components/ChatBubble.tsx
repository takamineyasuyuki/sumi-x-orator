interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-[#D4C4AE] bg-[#FFF9F0]">
          <img
            src="/john.jpg"
            alt="John"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback: show "J" if image not found
              const target = e.currentTarget;
              target.style.display = "none";
              target.parentElement!.innerHTML =
                '<span class="flex items-center justify-center w-full h-full text-xs font-bold text-[#B8D435]">J</span>';
            }}
          />
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#3D2B1F] text-[#F5EDE3] rounded-2xl rounded-br-sm"
            : "bg-[#FFF9F0] border border-[#D4C4AE] text-[#3D2B1F] rounded-2xl rounded-bl-sm shadow-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
