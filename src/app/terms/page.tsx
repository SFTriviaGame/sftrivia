import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

const injectedStyles = `
  .font-display { font-family: var(--font-display), Georgia, serif; }
  .font-body { font-family: var(--font-body), system-ui, sans-serif; }
`;

// ── Update these when ready ─────────────────────────────────────────────────
const SITE_NAME = "Deep Cut";
const CONTACT_EMAIL = "hello@example.com"; // Replace with real email
const EFFECTIVE_DATE = "April 2026"; // Replace with launch date

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="font-body text-sm text-[#737373] mb-10">
            Effective {EFFECTIVE_DATE}
          </p>

          <div className="font-body text-[15px] text-[#4a4a4a] leading-relaxed space-y-8">

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Welcome</h2>
              <p>
                {SITE_NAME} is a music trivia game. By using {SITE_NAME}, you agree to these
                terms. If you don&apos;t agree, please don&apos;t use the service. These terms are
                intentionally written in plain language.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Using {SITE_NAME}</h2>
              <p>
                {SITE_NAME} is free to play. You don&apos;t need an account to play, but some features
                (scores, titles, leaderboards) may require one when accounts launch. You agree
                to use the game for its intended purpose — playing music trivia — and not to
                abuse, exploit, or interfere with the service.
              </p>
              <p className="mt-3">
                Specifically, you agree not to: use bots, scripts, or automated tools to play or
                scrape the game; attempt to access other players&apos; data; deliberately exploit bugs
                to inflate scores or leaderboard positions; use the service to harass or harm
                others.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Accounts & Age Requirement</h2>
              <p>
                When accounts become available, you must be at least 18 years old to create one.
                Players under 18 can play in Day Pass mode, which does not store any personal
                data. By creating an account, you confirm you are 18 or older and that the
                information you provide is accurate.
              </p>
              <p className="mt-3">
                We may suspend or terminate accounts that violate these terms, engage in
                fraudulent activity, or abuse the service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Content & Intellectual Property</h2>
              <p>
                The {SITE_NAME} game, its design, code, and original content are owned by us.
                Song titles and artist names referenced in the game are the property of their
                respective rights holders and are used for informational and trivia purposes. We
                do not claim ownership of any third-party music metadata.
              </p>
              <p className="mt-3">
                You may share your results (score cards, screenshots) freely. We encourage it —
                that&apos;s how people discover the game. However, you may not reproduce, redistribute,
                or commercially exploit the game itself or its underlying data.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Scores, Titles & Leaderboards</h2>
              <p>
                Scores and titles are part of the game experience. We reserve the right to reset
                scores, adjust title thresholds, or modify leaderboard mechanics as the game
                evolves. We may remove scores or titles earned through exploitation of bugs or
                unfair play. Leaderboard positions are not guaranteed and may change at any time.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Advertising</h2>
              <p>
                {SITE_NAME} may display advertisements from third-party ad networks. These ads
                help keep the game free. Ad content is controlled by the ad networks, not by us.
                We are not responsible for the content, accuracy, or practices of third-party
                advertisers.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Availability & Changes</h2>
              <p>
                We aim to keep {SITE_NAME} available and working, but we don&apos;t guarantee
                uninterrupted access. We may update, modify, or discontinue features at any time.
                Daily puzzles, categories, game modes, and scoring mechanics may all change as the
                game grows.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Limitation of Liability</h2>
              <p>
                {SITE_NAME} is provided "as is" without warranties of any kind. We are not liable
                for any damages arising from your use of the service, including but not limited to
                lost data, interrupted access, or inaccurate trivia content. Our total liability
                to you for any claim related to the service is limited to the amount you paid us,
                which is zero — it&apos;s a free game.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Privacy</h2>
              <p>
                Your privacy matters. Please read our{" "}
                <Link
                  href="/privacy"
                  className="text-[#b45309] underline underline-offset-2 hover:text-[#a14a08]"
                >
                  Privacy Policy
                </Link>{" "}
                to understand what data we collect and how we use it.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Changes to These Terms</h2>
              <p>
                We may update these terms as {SITE_NAME} evolves. The effective date at the top
                will reflect when changes were last made. Continued use of the service after
                changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Contact</h2>
              <p>
                Questions or concerns? Reach us at{" "}
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
