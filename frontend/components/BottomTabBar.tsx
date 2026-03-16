import { MessageCircle, UtensilsCrossed } from "lucide-react";

interface BottomTabBarProps {
  activeTab: "chat" | "menu";
  onTabChange: (tab: "chat" | "menu") => void;
}

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div className="flex border-t border-[#D4C4AE] bg-[#F5EDE3]">
      <button
        onClick={() => onTabChange("chat")}
        className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
          activeTab === "chat" ? "text-[#B8D435]" : "text-[#8B7355]"
        }`}
      >
        <MessageCircle size={20} />
        <span className="text-[10px] font-medium">Chat</span>
      </button>
      <button
        onClick={() => onTabChange("menu")}
        className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
          activeTab === "menu" ? "text-[#B8D435]" : "text-[#8B7355]"
        }`}
      >
        <UtensilsCrossed size={20} />
        <span className="text-[10px] font-medium">Menu</span>
      </button>
    </div>
  );
}
