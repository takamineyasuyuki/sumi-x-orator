interface MenuCardProps {
  item: {
    "メニュー名(英)": string;
    "メニュー名(日)"?: string;
    カテゴリ?: string;
    値段: number;
    "メニュー説明(英)"?: string;
    "味・特徴"?: string;
    アレルギー情報?: string;
    写真URL?: string;
    担当シェフ名?: string;
  };
  soldOut?: boolean;
}

export default function MenuCard({ item, soldOut }: MenuCardProps) {
  const photoUrl = item["写真URL"];
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
      {photoUrl && (
        <div className="w-full h-32 overflow-hidden">
          <img src={photoUrl} alt={item["メニュー名(英)"]} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-[#3D2B1F]">{item["メニュー名(英)"]}</h3>
          {item.値段 > 0 && (
            <span className="text-sm text-[#8B7355] font-medium flex-shrink-0">
              ${item.値段}
            </span>
          )}
        </div>
        {item.担当シェフ名 && (
          <p className="text-[10px] text-[#B8D435] font-medium">
            Chef: {item.担当シェフ名}
          </p>
        )}
        {item["メニュー説明(英)"] && (
          <p className="text-xs text-[#8B7355] line-clamp-2">
            {item["メニュー説明(英)"]}
          </p>
        )}
        {item.アレルギー情報 && (
          <p className="text-[10px] text-[#C0392B]/70">
            Allergens: {item.アレルギー情報}
          </p>
        )}
      </div>
    </div>
  );
}
