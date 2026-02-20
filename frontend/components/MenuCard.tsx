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
    <div className="flex-shrink-0 w-56 bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
      {item.image_url && (
        <div className="relative h-36 bg-white/5">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-white/90">{item.name}</h3>
          {item.price > 0 && (
            <span className="text-sm text-white/60 flex-shrink-0">
              ${item.price}
            </span>
          )}
        </div>
        {item.description && item.description !== "TBD" && (
          <p className="text-xs text-white/40 line-clamp-2">
            {item.description}
          </p>
        )}
        {item.allergens && (
          <p className="text-[10px] text-amber-400/60">
            Allergens: {item.allergens}
          </p>
        )}
      </div>
    </div>
  );
}
