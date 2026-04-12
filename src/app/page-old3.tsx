import Link from "next/link";

const injectedStyles = `
  .font-display { font-family: var(--font-display), Georgia, serif; }
  .font-body { font-family: var(--font-body), system-ui, sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes revealBar {
    from { width: 0; }
    to { width: 100%; }
  }

  .stagger-1 { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both; }
  .stagger-2 { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both; }
  .stagger-3 { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both; }
  .stagger-4 { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.55s both; }
  .stagger-5 { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.7s both; }
  .stagger-6 { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.85s both; }

  .clue-1 { animation: slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.9s both; }
  .clue-2 { animation: slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 1.15s both; }
  .clue-3 { animation: slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 1.4s both; }
  .clue-4 { animation: slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 1.65s both; }

  .animate-bar { animation: revealBar 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both; }

  @media (prefers-reduced-motion: reduce) {
    .stagger-1, .stagger-2, .stagger-3, .stagger-4, .stagger-5, .stagger-6,
    .clue-1, .clue-2, .clue-3, .clue-4, .animate-bar {
      animation: none !important;
    }
  }
`;

const PREVIEW_CLUES = [
  { num: "01", label: "" },
  { num: "02", label: "" },
  { num: "03", label: "" },
  { num: "04", label: "" },
];

export default function HomePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
      <main
        id="main-content"
        className="fixed inset-0 bg-[#FAFAF8] flex flex-col items-center justify-center px-6 overflow-y-auto overflow-x-hidden"
      >
        <div className="text-center max-w-md w-full">

          {/* Branding */}
          <p className="font-body text-[10px] tracking-[6px] text-[#b45309] uppercase mb-3 stagger-1">
            Music Trivia
          </p>
          <h1 className="font-display text-6xl sm:text-7xl text-[#1a1a1a] mb-2 leading-[1] stagger-2">
            Deep Cut
          </h1>
          <p className="font-display text-xl sm:text-2xl text-[#737373] italic mb-10 stagger-3">
            Name the Artist
          </p>

          {/* Game preview — visual hint of the mechanic */}
          <div className="max-w-xs mx-auto mb-10 stagger-4" aria-hidden="true">
            <div className="flex items-center gap-2 mb-2 px-1">
              <p className="text-[9px] tracking-[3px] text-[#737373] uppercase font-body">Clues</p>
              <div className="flex gap-[3px]">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="w-[5px] h-[5px] rounded-full"
                    style={{ backgroundColor: i < 4 ? "#b45309" : "#e0ddd6" }}
                  />
                ))}
              </div>
            </div>
            {PREVIEW_CLUES.map((clue, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 clue-${i + 1} ${
                  i === 0
                    ? "bg-white shadow-sm ring-1 ring-[#b45309]/20"
                    : "bg-[#FAFAF8]"
                }`}
                style={{ opacity: i === 0 ? 1 : 0.5 }}
              >
                <span
                  className="text-[10px] font-mono w-4 text-right shrink-0 tabular-nums"
                  style={{ color: i === 0 ? "#b45309" : "#8a8580" }}
                >
                  {clue.num}
                </span>
                <div
                  className="h-[8px] rounded-sm bg-[#e5e2db]"
                  style={{ width: `${40 + ((i * 23) % 40)}%` }}
                />
              </div>
            ))}
          </div>

          {/* How it works */}
          <p className="font-body text-sm text-[#4a4a4a] leading-relaxed mb-8 max-w-[280px] mx-auto stagger-5">
            Songs reveal one at a time — deep cuts first, hits last. Guess the artist before time runs out.
          </p>

          {/* CTA */}
          <div className="stagger-6">
            <Link
              href="/play"
              className="font-body inline-block w-full max-w-[280px] py-3.5 rounded-lg text-sm font-semibold tracking-wide uppercase
                bg-[#b45309] text-white hover:bg-[#a14a08]
                active:scale-[0.97] transition-all duration-150 shadow-sm text-center"
            >
              Play
            </Link>
            <p className="font-body text-[11px] text-[#737373] mt-3">
              Free · No signup required
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
