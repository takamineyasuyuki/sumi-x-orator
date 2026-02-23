export default function DrunkJohn() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-6">
      {/* Drunk John: flipped image or fallback */}
      <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#D4C4AE] bg-[#FFF9F0] animate-bounce rotate-180"
           style={{ animationDuration: "2.5s" }}>
        <img
          src="/john.jpg"
          alt="John is napping"
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
        <p className="text-base font-medium text-[#3D2B1F]">
          Oops! John drank too much sake and is taking a nap!
        </p>
        <p className="text-sm text-[#8B7355]">
          Please call a human staff member!
        </p>
        <p className="text-xs text-[#8B7355]/60">
          (John is recovering... try again in a moment)
        </p>
      </div>
    </div>
  );
}
