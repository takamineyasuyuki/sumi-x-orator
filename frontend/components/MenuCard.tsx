interface MenuCardProps {
  item: {
    name: string;
    category?: string;
    price: number;
    description?: string;
    allergens?: string;
    chefs_note?: string;
    image_url?: string;
  };
}

export default function MenuCard({ item }: MenuCardProps) {
  return (
    <div className="flex-shrink-0 w-56 bg-[#2a1a0a] border border-[#e85d26]/15 rounded-xl overflow-hidden">
      {item.image_url && (
        <div className="relative h-36 bg-[#1a1008]">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-[#f5ebe0]">{item.name}</h3>
          {item.price > 0 && (
            <span className="text-sm text-[#e85d26] font-medium flex-shrink-0">
              ${item.price}
            </span>
          )}
        </div>
        {item.description && item.description !== "TBD" && (
          <p className="text-xs text-[#f5ebe0]/50 line-clamp-2">
            {item.description}
          </p>
        )}
        {item.allergens && (
          <p className="text-[10px] text-[#e85d26]/70">
            Allergens: {item.allergens}
          </p>
        )}
      </div>
    </div>
  );
}
