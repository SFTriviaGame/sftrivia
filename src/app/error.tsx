"use client";

import { useEffect } from "react";

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

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error reporting service here (Sentry, etc.)
    console.error("Deep Cut error:", error);
  }, [error]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
      <main
        id="main-content"
        className="fixed inset-0 bg-[#FAFAF8] flex flex-col items-center justify-center px-6"
      >
        <div className="animate-fade-up text-center max-w-sm w-full">
          <p className="font-body text-[10px] tracking-[5px] text-[#737373] uppercase mb-2">
            Something skipped
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-[#1a1a1a] mb-2 leading-[1.05]">
            Scratch That
          </h1>
          <p className="font-body text-sm text-[#4a4a4a] leading-relaxed mb-8 max-w-[280px] mx-auto">
            Something went wrong loading the game. Give it another spin — it usually sorts itself out.
          </p>

          <div className="space-y-3">
            <button
              onClick={reset}
              className="font-body block w-full py-3 rounded-lg text-sm font-semibold tracking-wide uppercase
                bg-[#b45309] text-white hover:bg-[#a14a08]
                active:scale-[0.97] transition-all duration-150 shadow-sm"
            >
              Try again
            </button>
            <a
              href="/"
              className="font-body block w-full py-3 rounded-lg text-sm font-medium text-center
                text-[#4a4a4a] border border-[#d5d0c7] hover:border-[#b45309] hover:text-[#b45309]
                active:scale-[0.97] transition-all duration-150"
            >
              Back to home
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
