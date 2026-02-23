interface MenuCardProps {
  item: {
    メニュー名: string;
    カテゴリー?: string;
    価格: number;
    "魅力・特徴"?: string;
    "アレルギー・注意"?: string;
    担当シェフ?: string;
  };
  soldOut?: boolean;
}

export default function MenuCard({ item, soldOut }: MenuCardProps) {
  return (
    <div className={`flex-shrink-0 w-56 rounded-xl overflow-hidden relative shadow-sm ${
      soldOut
        ? "bg-[#EDE4D8]/60 border border-[#D4C4AE]/50 opacity-50"
        : "bg-[#FFF9F0] border border-[#D4C4AE]"
    }`}>
      {soldOut && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="bg-[#C0392B]/90 text-white text-xs font-bold px-3 py-1 rounded-full -rotate-12">
            SOLD OUT
          </span>
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-[#3D2B1F]">{item.メニュー名}</h3>
          {item.価格 > 0 && (
            <span className="text-sm text-[#8B7355] font-medium flex-shrink-0">
              ${item.価格}
            </span>
          )}
        </div>
        {item.担当シェフ && (
          <p className="text-[10px] text-[#B8D435] font-medium">
            Chef: {item.担当シェフ}
          </p>
        )}
        {item["魅力・特徴"] && (
          <p className="text-xs text-[#8B7355] line-clamp-2">
            {item["魅力・特徴"]}
          </p>
        )}
        {item["アレルギー・注意"] && (
          <p className="text-[10px] text-[#C0392B]/70">
            Allergens: {item["アレルギー・注意"]}
          </p>
        )}
      </div>
    </div>
  );
}
