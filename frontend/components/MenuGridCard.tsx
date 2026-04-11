interface MenuItem {
  "メニュー名(英)": string;
  "メニュー名(日)"?: string;
  カテゴリ?: string;
  値段: number;
  "メニュー説明(英)"?: string;
  写真URL?: string;
  担当シェフ名?: string;
  おすすめフラグ?: boolean | string;
}

interface MenuGridCardProps {
  item: MenuItem;
  soldOut?: boolean;
  recommended?: boolean;
  onTap?: () => void;
}

export default function MenuGridCard({ item, soldOut, recommended, onTap }: MenuGridCardProps) {
  return (
    <button
      onClick={onTap}
      className={`w-full text-left rounded-xl overflow-hidden relative shadow-sm transition-transform active:scale-[0.98] ${
        soldOut
          ? "bg-[#EDE4D8]/60 border border-[#D4C4AE]/50 opacity-50"
          : "bg-[#FFF9F0] border border-[#D4C4AE]"
      }`}
    >
      {soldOut && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="bg-[#C0392B]/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full -rotate-12">
            SOLD OUT
          </span>
        </div>
      )}
      {recommended && !soldOut && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-[#B8D435] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            PICK
          </span>
        </div>
      )}
      {item["写真URL"] ? (
        <div className="w-full h-28 overflow-hidden">
          <img
            src={item["写真URL"]}
            alt={item["メニュー名(英)"]}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-20 bg-[#EDE4D8] flex items-center justify-center">
          <span className="text-2xl opacity-30">
            {item.カテゴリ === "ドリンク" || item.カテゴリ === "Drink" ? "🍶" : "🍽"}
          </span>
        </div>
      )}
      <div className="p-3 space-y-1">
        <h3 className="text-xs font-medium text-[#3D2B1F] leading-tight">{item["メニュー名(英)"]}</h3>
        {item["メニュー名(日)"] && (
          <p className="text-[10px] text-[#8B7355]">{item["メニュー名(日)"]}</p>
        )}
        {item.担当シェフ名 && (
          <p className="text-[9px] text-[#B8D435] font-medium">Chef: {item.担当シェフ名}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          {item.値段 > 0 && (
            <span className="text-xs text-[#3D2B1F] font-medium">${item.値段}</span>
          )}
          <span className="text-[9px] text-[#B8D435] font-medium">Ask Guu-taro →</span>
        </div>
      </div>
    </button>
  );
}
