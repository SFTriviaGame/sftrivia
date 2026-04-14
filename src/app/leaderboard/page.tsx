"use client";

import { useState, useEffect, useCallback } from "react";

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  title: string | null;
  titleType: string | null;
  titleLevel: number | null;
  puzzlesPlayed: number;
  metricValue: number;
  isYou: boolean;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  currentPlayerRank: LeaderboardEntry | null;
}

const METRICS = [
  { key: "total_score", label: "Total Score", format: (v: number) => v.toLocaleString() },
  { key: "avg_score", label: "Avg Score", format: (v: number) => v.toLocaleString() },
  { key: "best_streak", label: "Best Streak", format: (v: number) => String(v) },
  { key: "perfect_games", label: "Perfect", format: (v: number) => String(v) },
  { key: "early_guesses", label: "Early Guesses", format: (v: number) => String(v) },
];

const GENRE_FILTERS = [
  { key: "", label: "All" },
  { key: "hair-metal", label: "Hair Metal" },
  { key: "classic-rock", label: "Classic Rock" },
  { key: "pop", label: "Pop" },
  { key: "80s", label: "80s" },
  { key: "90s", label: "90s" },
  { key: "70s", label: "70s" },
  { key: "60s", label: "60s" },
  { key: "2000s", label: "2000s" },
  { key: "2010s", label: "2010s" },
];

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="hover:text-[#b45309] transition-colors">
      {children}
    </a>
  );
}

function NavDot() {
  return <span className="mx-2" aria-hidden="true">&middot;</span>;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState("total_score");
  const [selectedGenre, setSelectedGenre] = useState("");

  const fetchLeaderboard = useCallback(async (metric: string, genre: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ metric });
      if (genre) params.set("genre", genre);
      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
    } catch {
      setData({ entries: [], currentPlayerRank: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(selectedMetric, selectedGenre);
  }, [selectedMetric, selectedGenre, fetchLeaderboard]);

  const currentMetricConfig = METRICS.find((m) => m.key === selectedMetric) || METRICS[0];
  const formatValue = currentMetricConfig.format;

  return (
    <div className="min-h-screen w-full" style={{ background: "#FAFAF8", color: "#252018" }}>
      <div className="max-w-xl mx-auto px-5 py-8">

        {/* Header */}
        <section className="text-center mb-6 pt-4">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#b45309", fontFamily: "'DM Sans', sans-serif" }}>
            Leaderboard
          </p>
          <h1 className="text-4xl leading-tight mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Top Players
          </h1>
          <p className="text-sm" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>
            Ranked by {currentMetricConfig.label.toLowerCase()}
          </p>
        </section>

        {/* Metric tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-4 hide-scrollbar" role="tablist" aria-label="Leaderboard metrics">
          {METRICS.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={selectedMetric === m.key}
              onClick={() => setSelectedMetric(m.key)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-200"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: selectedMetric === m.key ? "#b45309" : "transparent",
                color: selectedMetric === m.key ? "#fff" : "#4a4a4a",
                borderColor: selectedMetric === m.key ? "#b45309" : "#d5d0c7",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Genre filters */}
        <div className="flex gap-1 overflow-x-auto pb-3 mb-5 hide-scrollbar" role="group" aria-label="Genre filter">
          {GENRE_FILTERS.map((g) => (
            <button
              key={g.key}
              onClick={() => setSelectedGenre(g.key)}
              aria-pressed={selectedGenre === g.key}
              className="shrink-0 text-xs px-2.5 py-1 rounded-md transition-all duration-200"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: selectedGenre === g.key ? "rgba(180,83,9,0.08)" : "transparent",
                color: selectedGenre === g.key ? "#b45309" : "#737373",
                fontWeight: selectedGenre === g.key ? 500 : 400,
              }}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>Loading...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && data && data.entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>
              No data yet. Be the first on the board.
            </p>
            <a href="/play" className="inline-block mt-3 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#b45309" }}>
              Play
            </a>
          </div>
        )}

        {/* Entries */}
        {!loading && data && data.entries.length > 0 && (
          <div>
            {/* Top 3 cards */}
            {data.entries.slice(0, 3).map((entry) => (
              <div
                key={entry.rank}
                className="mb-2 rounded-xl px-4 py-3"
                style={{
                  background: entry.isYou ? "rgba(180,83,9,0.06)" : entry.rank === 1 ? "rgba(0,0,0,0.03)" : "transparent",
                  border: entry.rank === 1 ? "1px solid rgba(180,83,9,0.2)" : "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center shrink-0">
                    <span
                      className="text-lg font-bold tabular-nums"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: entry.rank === 1 ? "#b45309" : entry.rank === 2 ? "#6b7280" : "#a16207",
                      }}
                    >
                      {entry.rank}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {entry.displayName}
                      </span>
                      {entry.isYou && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#b45309", color: "#fff", fontSize: "0.6rem" }}>You</span>
                      )}
                    </div>
                    {entry.title && (
                      <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>{entry.title}</p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: "#a3a3a3" }}>
                      {entry.puzzlesPlayed} puzzle{entry.puzzlesPlayed !== 1 ? "s" : ""} played
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-bold tabular-nums" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {formatValue(entry.metricValue)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Rest of leaderboard */}
            {data.entries.slice(3).map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center gap-3 py-2.5 px-1"
                style={{
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                  background: entry.isYou ? "rgba(180,83,9,0.04)" : "transparent",
                  borderRadius: entry.isYou ? "8px" : 0,
                }}
              >
                <span className="w-8 text-center text-xs tabular-nums shrink-0" style={{ color: "#a3a3a3", fontFamily: "'DM Sans', sans-serif" }}>
                  {entry.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm truncate" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: entry.isYou ? 600 : 400 }}>
                      {entry.displayName}
                    </span>
                    {entry.isYou && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#b45309", color: "#fff", fontSize: "0.6rem" }}>You</span>
                    )}
                  </div>
                  {entry.title && (
                    <p className="text-xs" style={{ color: "#b45309" }}>{entry.title}</p>
                  )}
                </div>
                <span className="text-sm font-medium tabular-nums shrink-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {formatValue(entry.metricValue)}
                </span>
              </div>
            ))}

            {/* Current player rank if not in top 20 */}
            {data.currentPlayerRank && !data.entries.some((e) => e.isYou) && (
              <>
                <div className="text-center py-2">
                  <span className="text-xs" style={{ color: "#d5d0c7" }}>· · ·</span>
                </div>
                <div
                  className="flex items-center gap-3 py-2.5 px-1 rounded-lg"
                  style={{ background: "rgba(180,83,9,0.04)" }}
                >
                  <span className="w-8 text-center text-xs tabular-nums shrink-0" style={{ color: "#b45309", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                    {data.currentPlayerRank.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {data.currentPlayerRank.displayName}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#b45309", color: "#fff", fontSize: "0.6rem" }}>You</span>
                    </div>
                    {data.currentPlayerRank.title && (
                      <p className="text-xs" style={{ color: "#b45309" }}>{data.currentPlayerRank.title}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {formatValue(data.currentPlayerRank.metricValue)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Nav footer */}
        <nav className="mt-10 text-center text-xs" style={{ color: "#737373" }}>
          <NavLink href="/play">Play</NavLink>
          <NavDot />
          <NavLink href="/genres">Genres</NavLink>
          <NavDot />
          <NavLink href="/profile">Profile</NavLink>
        </nav>

        <div className="h-16" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}
