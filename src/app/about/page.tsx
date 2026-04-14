import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Play",
};

const injectedStyles = `
  .font-display { font-family: var(--font-display), Georgia, serif; }
  .font-body { font-family: var(--font-body), system-ui, sans-serif; }
`;

export default function AboutPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
      <main
        id="main-content"
        className="min-h-screen bg-[#FAFAF8] px-6 py-16 overflow-x-hidden"
      >
        <article className="max-w-2xl mx-auto">
          <Link
            href="/play"
            className="font-body text-[11px] text-[#737373] hover:text-[#b45309] transition-colors"
          >
            <span aria-hidden="true">&larr; </span>Back to Play
          </Link>

          <h1 className="font-display text-4xl sm:text-5xl text-[#1a1a1a] mt-6 mb-10 leading-tight">
            How to Play
          </h1>

          <div className="font-body text-[15px] text-[#4a4a4a] leading-relaxed space-y-10">

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">The basics</h2>
              <p>
                Songs reveal one at a time. Deep cuts come first, hits come last.
                You guess the answer whenever you think you know it. The earlier
                you guess, the higher your score.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Modes</h2>
              <p className="mb-3">
                <span className="font-semibold text-[#1a1a1a]">Artist</span> &mdash;
                Songs from an artist&apos;s catalog reveal. You guess the artist.
              </p>
              <p>
                <span className="font-semibold text-[#1a1a1a]">Album</span> &mdash;
                Every track from a single album reveals. You guess the album.
                The artist is shown after you guess or give up.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Scoring</h2>
              <p className="mb-3">
                You start at 1,000 points. The score decays over 30 seconds.
                Each wrong guess costs 50 points. The floor is 50 points,
                which is what you get if you guess during the 3-second
                grace period after time runs out.
              </p>
              <p>
                Giving up scores zero.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Timer</h2>
              <p>
                30 seconds per puzzle. A new song reveals every 3 seconds.
                When the timer hits zero, you get a 3-second grace period
                to submit a final guess.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Categories</h2>
              <p>
                Puzzles are tagged by genre and decade. You can filter by
                category on the start screen or browse all available genres
                on the{" "}
                <Link
                  href="/genres"
                  className="text-[#b45309] underline underline-offset-2 hover:text-[#a14a08]"
                >
                  genres page
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-[#1a1a1a] mb-3">Guessing</h2>
              <p>
                Spelling doesn&apos;t have to be perfect. The game handles minor
                typos, accented characters, &ldquo;The&rdquo; prefixes, and
                &amp;/and variations. You can guess at any time, including
                during the preview before the timer starts.
              </p>
            </section>

          </div>

          <div className="mt-12 pt-6 border-t border-[#e8e5de]">
            <Link
              href="/play"
              className="font-body text-sm text-[#b45309] hover:text-[#a14a08] font-medium transition-colors"
            >
              Play Deep Cut <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
