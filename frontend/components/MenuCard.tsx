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
    <div className={`flex-shrink-0 w-56 bg-[#2a1a0a] border rounded-xl overflow-hidden relative ${
      soldOut ? "border-[#f5ebe0]/10 opacity-50" : "border-[#e85d26]/15"
    }`}>
      {soldOut && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="bg-red-600/90 text-white text-xs font-bold px-3 py-1 rounded-full -rotate-12">
            SOLD OUT
          </span>
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-[#f5ebe0]">{item.メニュー名}</h3>
          {item.価格 > 0 && (
            <span className="text-sm text-[#e85d26] font-medium flex-shrink-0">
              ${item.価格}
            </span>
          )}
        </div>
        {item.担当シェフ && (
          <p className="text-[10px] text-[#4CAF50]/80">
            Chef: {item.担当シェフ}
          </p>
        )}
        {item["魅力・特徴"] && (
          <p className="text-xs text-[#f5ebe0]/50 line-clamp-2">
            {item["魅力・特徴"]}
          </p>
        )}
        {item["アレルギー・注意"] && (
          <p className="text-[10px] text-[#e85d26]/70">
            Allergens: {item["アレルギー・注意"]}
          </p>
        )}
      </div>
    </div>
  );
}
