"use client";

import { useState, useEffect, useMemo } from "react";
import MenuGridCard from "./MenuGridCard";

interface MenuItem {
  "メニュー名(英)": string;
  "メニュー名(日)"?: string;
  カテゴリ?: string;
  値段: number;
  "メニュー説明(英)"?: string;
  写真URL?: string;
  担当シェフ名?: string;
  備考?: string;
  おすすめフラグ?: boolean | string;
}

interface AvailabilityItem {
  "メニュー名(英)": string;
  提供中: boolean;
}

interface MenuTabProps {
  regular: MenuItem[];
  special: MenuItem[];
  availability: AvailabilityItem[];
  onAskAbout: (itemName: string) => void;
}

const CATEGORY_ORDER = [
  "おでん", "前菜", "サラダ", "焼き物", "揚げ物", "鉄板", "ご飯もの", "麺類",
  "デザート", "ドリンク",
];

function isLunchTimeNow(): boolean {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Vancouver",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0");
  const totalMinutes = hour * 60 + minute;
  return totalMinutes >= 690 && totalMinutes < 840; // 11:30 - 14:00
}

export default function MenuTab({ regular, special, availability, onAskAbout }: MenuTabProps) {
  const [isLunch, setIsLunch] = useState(isLunchTimeNow);

  useEffect(() => {
    const interval = setInterval(() => setIsLunch(isLunchTimeNow()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const isAvailable = (name: string) => {
    if (availability.length === 0) return true;
    const found = availability.find((a) => a["メニュー名(英)"] === name);
    return found ? found.提供中 : true;
  };

  // Filter regular items by time
  const filteredRegular = useMemo(() => {
    return regular.filter((item) => {
      const note = (item.備考 || "").toLowerCase();
      if (note.includes("lunch only") && !isLunch) return false;
      return true;
    });
  }, [regular, isLunch]);

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const item of filteredRegular) {
      const cat = item.カテゴリ || "Other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    // Sort by defined order
    const sorted = Object.entries(map).sort(([a], [b]) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    return sorted;
  }, [filteredRegular]);

  const recommendedSpecials = special.filter(
    (item) => String(item.おすすめフラグ ?? "").toUpperCase() === "TRUE" || item.おすすめフラグ === true
  );
  const otherSpecials = special.filter(
    (item) => !(String(item.おすすめフラグ ?? "").toUpperCase() === "TRUE" || item.おすすめフラグ === true)
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      {/* Time indicator */}
      <div className="text-center">
        <span className="text-[10px] text-[#8B7355] bg-[#EDE4D8] rounded-full px-3 py-1 font-medium">
          {isLunch ? "Lunch Menu" : "Dinner Menu"}
        </span>
      </div>

      {/* Today's Specials */}
      {special.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-[#B8D435] uppercase tracking-wider mb-3 px-1">
            Today&apos;s Specials
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[...recommendedSpecials, ...otherSpecials].map((item) => (
              <MenuGridCard
                key={item["メニュー名(英)"]}
                item={item}
                soldOut={false}
                recommended={
                  String(item.おすすめフラグ ?? "").toUpperCase() === "TRUE" || item.おすすめフラグ === true
                }
                onTap={() => onAskAbout(item["メニュー名(英)"])}
              />
            ))}
          </div>
        </section>
      )}

      {/* Regular menu by category */}
      {grouped.map(([category, items]) => (
        <section key={category}>
          <h2 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3 px-1">
            {category}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <MenuGridCard
                key={item["メニュー名(英)"]}
                item={item}
                soldOut={!isAvailable(item["メニュー名(英)"])}
                recommended={
                  String(item.おすすめフラグ ?? "").toUpperCase() === "TRUE" || item.おすすめフラグ === true
                }
                onTap={() => onAskAbout(item["メニュー名(英)"])}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
