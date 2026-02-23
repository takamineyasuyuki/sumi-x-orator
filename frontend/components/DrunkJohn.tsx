export default function DrunkJohn() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-6">
      {/* Drunk John: flipped upside-down ochoko, red face */}
      <div className="w-32 h-32 animate-bounce" style={{ animationDuration: "2s" }}>
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
          {/* Green T-shirt body (upside down = on top) */}
          <path d="M16 48 C16 40 24 36 40 36 C56 36 64 40 64 48 L64 72 C64 76 60 80 40 80 C20 80 16 76 16 72 Z" fill="#4CAF50" />
          <path d="M16 48 L4 56 L12 60 L20 52" fill="#4CAF50" />
          <path d="M64 48 L76 56 L68 60 L60 52" fill="#4CAF50" />
          {/* Ochoko head (red face = drunk!) */}
          <ellipse cx="40" cy="28" rx="22" ry="20" fill="#FF8A80" stroke="#E0D5C8" strokeWidth="1" />
          {/* X eyes (knocked out) */}
          <path d="M26 22 L32 28 M32 22 L26 28" stroke="#2a1a0a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M48 22 L54 28 M54 22 L48 28" stroke="#2a1a0a" strokeWidth="2.5" strokeLinecap="round" />
          {/* Wobbly mouth */}
          <path d="M32 34 Q36 30 40 34 Q44 38 48 34" stroke="#2a1a0a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Blush (extra strong) */}
          <ellipse cx="24" cy="32" rx="4" ry="2" fill="#FF5252" opacity="0.6" />
          <ellipse cx="56" cy="32" rx="4" ry="2" fill="#FF5252" opacity="0.6" />
          {/* T-shirt collar */}
          <path d="M30 38 Q40 42 50 38" stroke="#388E3C" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* Zzz bubbles */}
      <div className="flex gap-2 text-2xl opacity-60 animate-pulse">
        <span>&#127862;</span>
        <span>&#128164;</span>
      </div>

      <div className="space-y-3 max-w-sm">
        <p className="text-base font-medium text-[#f5ebe0]">
          Oops! John drank too much sake and is taking a nap!
        </p>
        <p className="text-sm text-[#f5ebe0]/60">
          Please call a human staff member!
        </p>
        <p className="text-xs text-[#f5ebe0]/40">
          (John is recovering... try again in a moment)
        </p>
      </div>
    </div>
  );
}
