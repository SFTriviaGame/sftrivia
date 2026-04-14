"use client";

import { useState } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  title: string;
  tier: number;
  value: number | string;
  puzzles: number;
  isYou?: boolean;
}

// ── Metric tabs ─────────────────────────────────────────────────────────────

type Metric = "total" | "average" | "streak" | "perfect" | "early";

const METRICS: { id: Metric; label: string; sublabel: string }[] = [
  { id: "total", label: "Total Score", sublabel: "All-time points" },
  { id: "average", label: "Avg Score", sublabel: "Per puzzle" },
  { id: "streak", label: "Best Streak", sublabel: "Consecutive wins" },
  { id: "perfect", label: "Perfect Games", sublabel: "Zero wrong guesses" },
  { id: "early", label: "Early Guesses", sublabel: "Avg clue at guess" },
];

// ── Genre filter ────────────────────────────────────────────────────────────

const GENRES = [
  { id: "all", label: "All Genres" },
  { id: "hair-metal", label: "Hair Metal" },
  { id: "classic-rock", label: "Classic Rock" },
  { id: "pop", label: "Pop" },
  { id: "80s", label: "80s" },
  { id: "90s", label: "90s" },
  { id: "70s", label: "70s" },
  { id: "60s", label: "60s" },
  { id: "2000s", label: "2000s" },
  { id: "2010s", label: "2010s" },
];

// ── Mock data ───────────────────────────────────────────────────────────────

const MOCK_TITLES = [
  "Hair Metal Legend", "Classic Rock Master", "80s Scholar",
  "Pop Master", "90s Legend", "Metal Fusion Fanatic",
  "Riff Alchemist", "70s Scholar", "Blues Student",
  "Sunset Strip Veteran", "Indie Scholar", "Groove Theorist",
  "2000s Master", "Vinyl Purist", "Hip-Hop Student",
  "Electronic Initiate", "R&B Scholar", "Punk Master",
  "Jazz Student", "Country Initiate",
];

const MOCK_TIERS = [5, 4, 3, 4, 5, 2, 2, 3, 2, 2, 3, 2, 4, 2, 2, 1, 3, 4, 2, 1];

function generateMockData(metric: Metric): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (let i = 0; i < 20; i++) {
    let value: number | string;
    let puzzles: number;

    switch (metric) {
      case "total":
        value = Math.round(48000 - i * 2100 - Math.random() * 800);
        puzzles = Math.round(80 - i * 3 + Math.random() * 5);
        break;
      case "average":
        value = Math.round(780 - i * 22 - Math.random() * 15);
        puzzles = Math.round(60 - i * 2 + Math.random() * 8);
        break;
      case "streak":
        value = Math.round(24 - i * 1.1 - Math.random() * 0.5);
        if (value < 2) value = 2;
        puzzles = Math.round(70 - i * 2.5 + Math.random() * 6);
        break;
      case "perfect":
        value = Math.round(18 - i * 0.8 - Math.random() * 0.3);
        if (value < 1) value = 1;
        puzzles = Math.round(65 - i * 2 + Math.random() * 5);
        break;
      case "early":
        value = (1.8 + i * 0.15 + Math.random() * 0.1).toFixed(1);
        puzzles = Math.round(55 - i * 2 + Math.random() * 7);
        break;
    }

    entries.push({
      rank: i + 1,
      title: MOCK_TITLES[i],
      tier: MOCK_TIERS[i],
      value,
      puzzles: Math.max(puzzles, 5),
      isYou: i === 7,
    });
  }

  return entries;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const injectedStyles = `
  .font-display { font-family: var(--font-display), Georgia, serif; }
  .font-body { font-family: var(--font-body), system-ui, sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-up { animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }

  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }

  @media (prefers-reduced-motion: reduce) {
    .animate-fade-up { animation: none !important; }
  }
`;

// ── Tier badge ──────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-[9px] font-medium px-1.5 py-0.5"
      style={{ background: "#faeeda", color: "#854f0b" }}
    >
      T{tier}
    </span>
  );
}

// ── Value formatter ─────────────────────────────────────────────────────────

function formatValue(metric: Metric, value: number | string): string {
  switch (metric) {
    case "total":
      return Number(value).toLocaleString();
    case "average":
      return String(value);
    case "streak":
      return `${value} wins`;
    case "perfect":
      return `${value} games`;
    case "early":
      return `clue ${value}`;
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [selectedMetric, setSelectedMetric] = useState<Metric>("total");
  const [selectedGenre, setSelectedGenre] = useState("all");

  const entries = generateMockData(selectedMetric);
  const currentMetric = METRICS.find((m) => m.id === selectedMetric)!;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
      <main
        id="main-content"
        className="min-h-screen bg-[#FAFAF8] px-5 py-8 overflow-x-hidden"
      >
        <div className="max-w-lg mx-auto">

          {/* Header */}
          <div className="mb-6">
            <a
              href="/play"
              className="font-body text-[11px] text-[#737373] hover:text-[#b45309] transition-colors"
            >
              <span aria-hidden="true">← </span>Back to Play
            </a>
            <h1
              className="font-display text-3xl sm:text-4xl text-[#1a1a1a] mt-4 mb-1 leading-tight"
            >
              Leaderboard
            </h1>
            <p className="font-body text-sm text-[#737373]">
              {currentMetric.sublabel}
            </p>
          </div>

          {/* Metric tabs */}
          <div className="flex gap-1 mb-5 overflow-x-auto hide-scrollbar pb-0.5" role="tablist" aria-label="Leaderboard metric">
            {METRICS.map((metric) => (
              <button
                key={metric.id}
                role="tab"
                aria-selected={selectedMetric === metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                className={`font-body text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-200 ${
                  selectedMetric === metric.id
                    ? "bg-[#1a1a1a] text-white font-medium"
                    : "bg-transparent text-[#737373] hover:text-[#4a4a4a] hover:bg-[#eae7e0]"
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>

          {/* Genre filter */}
          <div className="flex gap-1 mb-6 overflow-x-auto hide-scrollbar pb-0.5" role="group" aria-label="Genre filter">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                aria-pressed={selectedGenre === genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`font-body text-[10px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-all duration-200 ${
                  selectedGenre === genre.id
                    ? "bg-[#b45309] text-white border-[#b45309]"
                    : "bg-transparent text-[#737373] border-[#d5d0c7] hover:border-[#b45309] hover:text-[#b45309]"
                }`}
              >
                {genre.label}
              </button>
            ))}
          </div>

          {/* Leaderboard list */}
          <div className="space-y-1">
            {entries.map((entry, i) => (
              <div
                key={entry.rank}
                className={`
                  animate-fade-up flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all
                  ${entry.isYou
                    ? "bg-[#b45309]/[0.06] ring-1 ring-[#b45309]/20"
                    : entry.rank <= 3
                      ? "bg-white ring-1 ring-[#e8e5de]"
                      : "bg-[#FAFAF8]"
                  }
                `}
                style={{ animationDelay: `${i * 25}ms` }}
              >
                {/* Rank */}
                <span
                  className={`font-body text-sm font-bold tabular-nums w-7 text-right shrink-0 ${
                    entry.rank === 1 ? "text-[#b45309]"
                    : entry.rank === 2 ? "text-[#737373]"
                    : entry.rank === 3 ? "text-[#a0785a]"
                    : "text-[#a09a90]"
                  }`}
                >
                  {entry.rank}
                </span>

                {/* Title + tier */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`font-body text-sm truncate ${
                        entry.isYou ? "font-medium text-[#b45309]" : "text-[#1a1a1a]"
                      }`}
                    >
                      {entry.title}
                      {entry.isYou && (
                        <span className="text-[10px] text-[#b45309] ml-1.5 font-normal">(you)</span>
                      )}
                    </p>
                    <TierBadge tier={entry.tier} />
                  </div>
                  <p className="font-body text-[10px] text-[#a09a90] mt-0.5">
                    {entry.puzzles} puzzles played
                  </p>
                </div>

                {/* Value */}
                <div className="text-right shrink-0">
                  <p
                    className={`font-body text-sm font-semibold tabular-nums ${
                      entry.rank === 1 ? "text-[#b45309]"
                      : entry.isYou ? "text-[#b45309]"
                      : "text-[#1a1a1a]"
                    }`}
                  >
                    {formatValue(selectedMetric, entry.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="font-body text-[11px] text-[#a09a90] text-center mt-8 italic">
            Leaderboard updates daily. Create an account to appear on the board.
          </p>

          {/* Footer nav */}
          <nav className="mt-8 pt-6 border-t border-[#e8e5de] font-body text-[11px] text-[#737373]" aria-label="Navigation">
            <a href="/genres" className="hover:text-[#b45309] transition-colors">Genres</a>
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
