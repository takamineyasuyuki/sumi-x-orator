"use client";

import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RegularItem {
  カテゴリ: string;
  "メニュー名(英)": string;
  "メニュー名(日)": string;
  値段: number | string;
  提供中: boolean;
}

interface SpecialItem {
  担当シェフ名: string;
  カテゴリ: string;
  "メニュー名(英)": string;
  "メニュー名(日)": string;
  値段: number | string;
  おすすめフラグ: boolean;
  常駐フラグ: boolean;
}

export default function StaffPage() {
  const [regular, setRegular] = useState<RegularItem[]>([]);
  const [special, setSpecial] = useState<SpecialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [tab, setTab] = useState<"special" | "regular">("special");

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${password}` }),
    [password]
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/menu/staff`, {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.status === 401) { setAuthed(false); setAuthError(true); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRegular(data.regular);
      setSpecial(data.special);
      setError(false);
      setAuthed(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);
    fetchItems();
  };

  const toggleFlag = async (menuName: string, flag: string, currentValue: boolean) => {
    const key = `${menuName}:${flag}`;
    setToggling(key);
    // Optimistic update
    setSpecial((prev) =>
      prev.map((item) =>
        item["メニュー名(英)"] === menuName
          ? { ...item, [flag]: !currentValue }
          : item
      )
    );
    try {
      const res = await fetch(`${API_URL}/api/menu/toggle`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ menu_name: menuName, flag, value: !currentValue }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setSpecial((prev) =>
        prev.map((item) =>
          item["メニュー名(英)"] === menuName
            ? { ...item, [flag]: currentValue }
            : item
        )
      );
    } finally {
      setToggling(null);
    }
  };

  const toggleSoldOut = async (menuName: string, currentAvailable: boolean) => {
    const key = `soldout:${menuName}`;
    setToggling(key);
    setRegular((prev) =>
      prev.map((item) =>
        item["メニュー名(英)"] === menuName ? { ...item, 提供中: !currentAvailable } : item
      )
    );
    try {
      const res = await fetch(`${API_URL}/api/menu/soldout`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ menu_name: menuName, available: !currentAvailable }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRegular((prev) =>
        prev.map((item) =>
          item["メニュー名(英)"] === menuName ? { ...item, 提供中: currentAvailable } : item
        )
      );
    } finally {
      setToggling(null);
    }
  };

  const specialGrouped = special.reduce<Record<string, SpecialItem[]>>((acc, item) => {
    const cat = item.カテゴリ || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const regularGrouped = regular.reduce<Record<string, RegularItem[]>>((acc, item) => {
    const cat = item.カテゴリ || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Login screen
  if (!authed) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-6">
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-[0.1em] text-[#3D2B1F]">Guu Staff</h1>
            <p className="text-[10px] text-[#8B7355] tracking-[0.15em] uppercase">Menu Control</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Staff password"
            className="w-full bg-[#FFF9F0] border border-[#D4C4AE] rounded-lg px-4 py-3 text-sm text-[#3D2B1F]
                       placeholder:text-[#8B7355]/50 focus:outline-none focus:border-[#B8D435] transition-colors"
            autoFocus
          />
          {authError && (
            <p className="text-red-500 text-xs text-center">Wrong password</p>
          )}
          <button
            type="submit"
            disabled={!password || loading}
            className="w-full py-3 bg-[#B8D435] text-white rounded-lg text-sm font-medium
                       hover:bg-[#A5C02E] disabled:opacity-30 transition-all"
          >
            {loading ? "Checking..." : "Login"}
          </button>
        </form>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-[#8B7355] text-sm">Loading menu...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-[#8B7355] text-sm">Backend connection failed</p>
          <button
            onClick={() => fetchItems()}
            className="px-4 py-2 bg-[#B8D435] text-white rounded-lg text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] max-w-lg mx-auto pb-8">
      <header className="sticky top-0 z-10 bg-[#F5EDE3] border-b border-[#D4C4AE] px-5 py-4">
        <h1 className="text-lg font-bold tracking-[0.1em] text-[#3D2B1F]">Guu Staff</h1>
        <p className="text-[10px] text-[#8B7355] tracking-[0.15em] uppercase">Menu Control</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setTab("special")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === "special"
                ? "bg-[#B8D435] text-white"
                : "bg-[#EDE4D8] text-[#8B7355]"
            }`}
          >
            Special
          </button>
          <button
            onClick={() => setTab("regular")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === "regular"
                ? "bg-[#B8D435] text-white"
                : "bg-[#EDE4D8] text-[#8B7355]"
            }`}
          >
            Regular
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-6">
        {tab === "special" && Object.entries(specialGrouped).map(([category, catItems]) => (
          <section key={category}>
            <h2 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3 px-1">
              {category}
            </h2>
            <div className="space-y-1.5">
              {catItems.map((item) => {
                const name = item["メニュー名(英)"];
                return (
                  <div
                    key={name}
                    className="px-4 py-3.5 bg-[#FFF9F0] rounded-xl border border-[#D4C4AE] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-[#3D2B1F]">{name}</span>
                        {item.担当シェフ名 && (
                          <span className="ml-2 text-[10px] text-[#B8D435] font-medium">
                            Chef: {item.担当シェフ名}
                          </span>
                        )}
                      </div>
                      {item.値段 && (
                        <span className="text-xs text-[#8B7355]">${item.値段}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-[#8B7355]">
                        <button
                          onClick={() => toggleFlag(name, "おすすめフラグ", item.おすすめフラグ)}
                          disabled={toggling === `${name}:おすすめフラグ`}
                          className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${
                            item.おすすめフラグ ? "bg-[#B8D435]" : "bg-[#D4C4AE]"
                          } ${toggling === `${name}:おすすめフラグ` ? "opacity-50" : ""}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                            item.おすすめフラグ ? "translate-x-4" : "translate-x-0.5"
                          }`} />
                        </button>
                        Recommend
                      </label>
                      <label className="flex items-center gap-2 text-xs text-[#8B7355]">
                        <button
                          onClick={() => toggleFlag(name, "常駐フラグ", item.常駐フラグ)}
                          disabled={toggling === `${name}:常駐フラグ`}
                          className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${
                            item.常駐フラグ ? "bg-[#3D7AC0]" : "bg-[#D4C4AE]"
                          } ${toggling === `${name}:常駐フラグ` ? "opacity-50" : ""}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                            item.常駐フラグ ? "translate-x-4" : "translate-x-0.5"
                          }`} />
                        </button>
                        Permanent
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {tab === "regular" && Object.entries(regularGrouped).map(([category, catItems]) => (
          <section key={category}>
            <h2 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3 px-1">
              {category}
            </h2>
            <div className="space-y-1.5">
              {catItems.map((item) => {
                const name = item["メニュー名(英)"];
                const key = `soldout:${name}`;
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between px-4 py-3.5 bg-[#FFF9F0] rounded-xl border border-[#D4C4AE]"
                  >
                    <span className={`text-sm font-medium ${
                      item.提供中 ? "text-[#3D2B1F]" : "text-[#8B7355]/40 line-through"
                    }`}>
                      {name}
                    </span>
                    <button
                      onClick={() => toggleSoldOut(name, item.提供中)}
                      disabled={toggling === key}
                      className={`relative w-16 h-9 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        item.提供中 ? "bg-[#B8D435]" : "bg-[#D4C4AE]"
                      } ${toggling === key ? "opacity-50" : ""}`}
                      aria-label={`${name}: ${item.提供中 ? "ON" : "SOLD OUT"}`}
                    >
                      <span
                        className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow transition-transform duration-200 ${
                          item.提供中 ? "translate-x-8" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
