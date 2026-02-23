"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface StaffMenuItem {
  メニュー名: string;
  カテゴリー: string;
  提供中: boolean;
}

export default function StaffPage() {
  const [items, setItems] = useState<StaffMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // ------------------------------------------------------------------
  // Fetch menu items
  // ------------------------------------------------------------------
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/menu/staff`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ------------------------------------------------------------------
  // Toggle availability
  // ------------------------------------------------------------------
  const toggle = async (menuName: string, currentValue: boolean) => {
    setToggling(menuName);
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.メニュー名 === menuName ? { ...item, 提供中: !currentValue } : item
      )
    );

    try {
      const res = await fetch(`${API_URL}/api/menu/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_name: menuName, available: !currentValue }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((item) =>
          item.メニュー名 === menuName ? { ...item, 提供中: currentValue } : item
        )
      );
    } finally {
      setToggling(null);
    }
  };

  // ------------------------------------------------------------------
  // Group by category
  // ------------------------------------------------------------------
  const grouped = items.reduce<Record<string, StaffMenuItem[]>>((acc, item) => {
    const cat = item.カテゴリー || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-[#f5ebe0]/40 text-sm">Loading menu...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-[#f5ebe0]/60 text-sm">Backend connection failed</p>
          <button
            onClick={() => { setLoading(true); fetchItems(); }}
            className="px-4 py-2 bg-[#e85d26]/20 text-[#e85d26] rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] max-w-lg mx-auto pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1a1008] border-b border-[#e85d26]/15 px-5 py-4">
        <h1 className="text-lg font-bold tracking-[0.15em] text-[#e85d26]">Guu Staff</h1>
        <p className="text-[10px] text-[#f5ebe0]/40 tracking-[0.15em] uppercase">Menu Control</p>
      </header>

      {/* Menu toggles grouped by category */}
      <div className="px-4 pt-4 space-y-6">
        {Object.entries(grouped).map(([category, catItems]) => (
          <section key={category}>
            <h2 className="text-xs font-bold text-[#e85d26]/60 uppercase tracking-wider mb-3 px-1">
              {category}
            </h2>
            <div className="space-y-1">
              {catItems.map((item) => (
                <div
                  key={item.メニュー名}
                  className="flex items-center justify-between px-4 py-3.5 bg-[#2a1a0a] rounded-xl border border-[#e85d26]/10"
                >
                  <span className={`text-sm font-medium ${
                    item.提供中 ? "text-[#f5ebe0]" : "text-[#f5ebe0]/30 line-through"
                  }`}>
                    {item.メニュー名}
                  </span>

                  {/* Giant toggle switch */}
                  <button
                    onClick={() => toggle(item.メニュー名, item.提供中)}
                    disabled={toggling === item.メニュー名}
                    className={`relative w-16 h-9 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      item.提供中 ? "bg-[#4CAF50]" : "bg-[#f5ebe0]/15"
                    } ${toggling === item.メニュー名 ? "opacity-50" : ""}`}
                    aria-label={`${item.メニュー名}: ${item.提供中 ? "ON" : "OFF"}`}
                  >
                    <span
                      className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow transition-transform duration-200 ${
                        item.提供中 ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
