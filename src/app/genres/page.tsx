"use client";

import { useState, useEffect } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

interface GenreData {
  id: string;
  artistCount: number;
  albumCount: number;
  totalCount: number;
}

// ── Genre display config ────────────────────────────────────────────────────

const GENRE_LABELS: Record<string, string> = {
  "60s": "60s",
  "70s": "70s",
  "80s": "80s",
  "90s": "90s",
  "2000s": "2000s",
  "2010s": "2010s",
  "hair-metal": "Hair Metal",
  "classic-rock": "Classic Rock",
  "pop": "Pop",
  "hip-hop": "Hip-Hop",
  "country": "Country",
  "metal": "Metal",
  "punk": "Punk",
  "jazz": "Jazz",
  "blues": "Blues",
  "electronic": "Electronic",
  "r-and-b": "R&B / Soul",
  "indie": "Indie",
  "folk": "Folk",
  "reggae": "Reggae",
  "latin": "Latin",
  "grunge": "Grunge",
  "new-wave": "New Wave",
  "disco-funk": "Disco / Funk",
  "southern-rock": "Southern Rock",
  "prog-rock": "Prog Rock",
  "emo": "Emo",
  "nu-metal": "Nu Metal",
};

// Group genres into sections
const SECTIONS = [
  {
    label: "Decades",
    genres: ["60s", "70s", "80s", "90s", "2000s", "2010s"],
  },
  {
    label: "Genres",
    genres: [
      "hair-metal", "classic-rock", "pop", "hip-hop", "country",
      "metal", "punk", "jazz", "blues", "electronic", "r-and-b",
      "indie", "folk", "reggae", "latin", "grunge", "new-wave",
      "disco-funk", "southern-rock", "prog-rock", "emo", "nu-metal",
    ],
  },
];

// ── Styles ──────────────────────────────────────────────────────────────────

const injectedStyles = `
  .font-display { font-family: var(--font-display), Georgia, serif; }
  .font-body { font-family: var(--font-body), system-ui, sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-up { animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }

  @media (prefers-reduced-motion: reduce) {
    .animate-fade-up { animation: none !important; }
  }
`;

// ── Component ───────────────────────────────────────────────────────────────

export default function GenresPage() {
  const [genres, setGenres] = useState<GenreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/genres")
      .then((r) => r.json())
      .then((data) => {
        setGenres(data.genres || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const genreMap: Record<string, GenreData> = {};
  genres.forEach((g) => { genreMap[g.id] = g; });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
      <main
        id="main-content"
        className="min-h-screen bg-[#FAFAF8] px-5 py-8 overflow-x-hidden"
      >
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <a
              href="/play"
              className="font-body text-[11px] text-[#737373] hover:text-[#b45309] transition-colors"
            >
              <span aria-hidden="true">← </span>Back to Play
            </a>
            <h1
              className="font-display text-3xl sm:text-4xl text-[#1a1a1a] mt-4 mb-1 leading-tight"
            >
              Browse Genres
            </h1>
            <p className="font-body text-sm text-[#737373]">
              Pick a genre and start playing. Your stats will track per genre as you go.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-16">
              <p className="font-body text-sm text-[#737373]">Loading genres...</p>
            </div>
          )}

          {/* Sections */}
          {!loading && SECTIONS.map((section, sIdx) => (
            <section key={section.label} className="mb-10">
              <p
                className="font-body text-[10px] tracking-[3px] text-[#737373] uppercase mb-3"
              >
                {section.label}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {section.genres.map((genreId, gIdx) => {
                  const data = genreMap[genreId];
                  const total = data?.totalCount || 0;
                  const artistCount = data?.artistCount || 0;
                  const albumCount = data?.albumCount || 0;
                  const isEmpty = total === 0;
                  const label = GENRE_LABELS[genreId] || genreId;

                  return (
                    <a
                      key={genreId}
                      href={isEmpty ? undefined : `/play?tag=${genreId}`}
                      className={`
                        animate-fade-up block rounded-xl px-4 py-3.5 transition-all duration-200
                        ${isEmpty
                          ? "bg-[#f0eeea] cursor-default opacity-50"
                          : "bg-white ring-1 ring-[#e8e5de] hover:ring-[#b45309]/30 hover:shadow-sm active:scale-[0.98] cursor-pointer"
                        }
                      `}
                      style={{ animationDelay: `${(sIdx * 6 + gIdx) * 30}ms` }}
                      aria-label={isEmpty ? `${label} — coming soon` : `Play ${label} — ${total} puzzles`}
                    >
                      <p
                        className={`font-display text-lg leading-tight mb-1 ${
                          isEmpty ? "text-[#a09a90]" : "text-[#1a1a1a]"
                        }`}
                      >
                        {label}
                      </p>

                      {isEmpty ? (
                        <p className="font-body text-[11px] text-[#a09a90] italic">
                          Coming soon
                        </p>
                      ) : (
                        <div className="font-body text-[11px] text-[#737373]">
                          <p>
                            {total} {total === 1 ? "puzzle" : "puzzles"}
                          </p>
                          <p className="text-[10px] text-[#a09a90] mt-0.5">
                            {artistCount > 0 && `${artistCount} artist`}
                            {artistCount > 0 && albumCount > 0 && " · "}
                            {albumCount > 0 && `${albumCount} album`}
                          </p>
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Footer nav */}
          <nav className="mt-6 pt-6 border-t border-[#e8e5de] font-body text-[11px] text-[#737373]" aria-label="Navigation">
            <a href="/play" className="hover:text-[#b45309] transition-colors">Play</a>
            <span className="mx-2" aria-hidden="true">·</span>
            <a href="/profile" className="hover:text-[#b45309] transition-colors">Profile</a>
            <span className="mx-2" aria-hidden="true">·</span>
            <a href="/privacy" className="hover:text-[#b45309] transition-colors">Privacy</a>
            <span className="mx-2" aria-hidden="true">·</span>
            <a href="/terms" className="hover:text-[#b45309] transition-colors">Terms</a>
          </nav>

        </div>
      </main>
    </>
  );
}
