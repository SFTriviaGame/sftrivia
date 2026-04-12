import Link from "next/link";

const injectedStyles = `
  .font-display { font-family: var(--font-display), Georgia, serif; }
  .font-body { font-family: var(--font-body), system-ui, sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }

  @media (prefers-reduced-motion: reduce) {
    .animate-fade-up { animation: none !important; }
  }
`;

export default function NotFound() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
      <main
        id="main-content"
        className="fixed inset-0 bg-[#FAFAF8] flex flex-col items-center justify-center px-6"
      >
        <div className="animate-fade-up text-center max-w-sm w-full">
          <p className="font-body text-[10px] tracking-[5px] text-[#737373] uppercase mb-2">
            Track not found
          </p>
          <h1 className="font-display text-5xl sm:text-6xl text-[#1a1a1a] mb-2 leading-[1.05]">
            404
          </h1>
          <p className="font-display text-lg text-[#737373] italic mb-8">
            That's a deep cut even we don't have
          </p>

          <div className="space-y-3">
            <Link
              href="/play"
              className="font-body block w-full py-3 rounded-lg text-sm font-semibold tracking-wide uppercase text-center
                bg-[#b45309] text-white hover:bg-[#a14a08]
                active:scale-[0.97] transition-all duration-150 shadow-sm"
            >
              Play a round
            </Link>
            <Link
              href="/"
              className="font-body block w-full py-3 rounded-lg text-sm font-medium text-center
                text-[#4a4a4a] border border-[#d5d0c7] hover:border-[#b45309] hover:text-[#b45309]
                active:scale-[0.97] transition-all duration-150"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
