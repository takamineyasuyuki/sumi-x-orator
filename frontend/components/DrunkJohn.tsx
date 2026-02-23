interface DrunkJohnProps {
  title?: string;
  subtitle?: string;
  hint?: string;
}

export default function DrunkJohn({
  title = "Oops! John drank too much sake and is taking a nap!",
  subtitle = "Please call a human staff member!",
  hint = "(John is recovering... try again in a moment)",
}: DrunkJohnProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-6">
      <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-[#D4C4AE] bg-[#FFF9F0] animate-bounce"
           style={{ animationDuration: "2.5s" }}>
        <img
          src="/john-drunk.jpg"
          alt="John is hungover"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            target.parentElement!.innerHTML =
              '<span class="flex items-center justify-center w-full h-full text-3xl font-bold text-[#C0392B]">X_X</span>';
          }}
        />
      </div>

      <div className="space-y-3 max-w-sm">
        <p className="text-base font-medium text-[#3D2B1F]">{title}</p>
        <p className="text-sm text-[#8B7355]">{subtitle}</p>
        <p className="text-xs text-[#8B7355]/60">{hint}</p>
      </div>
    </div>
  );
}
