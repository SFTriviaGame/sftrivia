import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const injectedStyles = `
  .font-display { font-family: var(--font-display), Georgia, serif; }
  .font-body { font-family: var(--font-body), system-ui, sans-serif; }
`;

// ── Update these when ready ─────────────────────────────────────────────────
const SITE_NAME = "Deep Cut";
const CONTACT_EMAIL = "hello@example.com"; // Replace with real email
const EFFECTIVE_DATE = "April 2026"; // Replace with launch date
const SITE_URL = "your-app.vercel.app"; // Replace with real domain

export default function PrivacyPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
      <main
        id="main-content"
        className="min-h-screen bg-[#FAFAF8] px-6 py-16 overflow-x-hidden"
      >
        <article className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="font-body text-[11px] text-[#737373] hover:text-[#b45309] transition-colors"
          >
            <span aria-hidden="true">← </span>Back to {SITE_NAME}
          </Link>

          <h1 className="font-display text-4xl sm:text-5xl text-[#1a1a1a] mt-6 mb-2 leading-tight">
            Privacy Policy
          </h1>
          <p className="font-body text-sm text-[#737373] mb-10">
            Effective {EFFECTIVE_DATE}
          </p>

          <div className="font-body text-[15px] text-[#4a4a4a] leading-relaxed space-y-8">

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">What {SITE_NAME} Is</h2>
              <p>
                {SITE_NAME} is a free music trivia game. Songs from an artist's catalog reveal one
                at a time — deep cuts first, hits last — and you guess the artist. We built it
                because we love music and wanted a game that rewards real knowledge.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Information We Collect</h2>

              <h3 className="font-body text-[15px] font-semibold text-[#1a1a1a] mt-4 mb-1">
                Without an account (current default)
              </h3>
              <p>
                If you play without signing up, we store your session score (total points, games
                played, win rate, and streak) in your browser's localStorage. This data never
                leaves your device. We do not store it on our servers. Clearing your browser data
                erases it.
              </p>

              <h3 className="font-body text-[15px] font-semibold text-[#1a1a1a] mt-4 mb-1">
                With an account (coming soon)
              </h3>
              <p>
                When we launch accounts, you'll be able to sign up with your email address via a
                magic link — no password required. If you create an account, we will store your
                email address, game history, scores, and any titles or achievements you earn. We
                will never sell your email to third parties.
              </p>

              <h3 className="font-body text-[15px] font-semibold text-[#1a1a1a] mt-4 mb-1">
                Players under 18
              </h3>
              <p>
                Players under 18 use the game in Day Pass mode. We do not collect, store, or
                process any personal information from players under 18 — no email, no cookies, no
                persistent identifiers of any kind. When a Day Pass session ends, everything
                is gone.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Analytics</h2>
              <p>
                We use Google Analytics to understand how people use {SITE_NAME} — which pages are
                visited, how long sessions last, which features are popular, and where players
                drop off. Google Analytics collects information such as your device type, browser,
                approximate location (country/region level), and pages viewed. This data is
                aggregated and does not personally identify you. You can opt out of Google
                Analytics by installing the{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#b45309] underline underline-offset-2 hover:text-[#a14a08]"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Advertising</h2>
              <p>
                {SITE_NAME} may display ads served by third-party advertising networks. These
                networks may use cookies and similar technologies to serve ads based on your
                prior visits to this and other websites. We do not control the data collection
                practices of these ad networks. You can learn more about opting out of
                personalized advertising at{" "}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#b45309] underline underline-offset-2 hover:text-[#a14a08]"
                >
                  aboutads.info/choices
                </a>{" "}
                or{" "}
                <a
                  href="https://www.networkadvertising.org/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#b45309] underline underline-offset-2 hover:text-[#a14a08]"
                >
                  networkadvertising.org/choices
                </a>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Cookies</h2>
              <p>
                {SITE_NAME} itself uses localStorage (not cookies) to save your game progress.
                However, Google Analytics and third-party ad networks may set cookies on your
                browser. You can manage or disable cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Data Retention & Deletion</h2>
              <p>
                Browser-stored data (localStorage) is under your control — clear it anytime
                through your browser settings. When accounts launch, you will be able to request
                deletion of your account and all associated data by contacting us. We will process
                deletion requests within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Changes to This Policy</h2>
              <p>
                We may update this policy as {SITE_NAME} evolves — particularly when we add
                accounts and new features. We'll note the effective date at the top. Continued
                use of {SITE_NAME} after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Contact</h2>
              <p>
                Questions about this policy? Reach us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-[#b45309] underline underline-offset-2 hover:text-[#a14a08]"
                >
                  {CONTACT_EMAIL}
                </a>.
              </p>
            </section>

          </div>

          <div className="mt-12 pt-6 border-t border-[#e8e5de]">
            <Link
              href="/play"
              className="font-body text-sm text-[#b45309] hover:text-[#a14a08] font-medium transition-colors"
            >
              Play {SITE_NAME} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
