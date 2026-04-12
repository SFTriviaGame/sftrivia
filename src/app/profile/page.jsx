"use client";

import { useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const MOCK_PLAYER = {
  title: "Hair Metal Master",
  tier: 1,
  depthLabel: "Crüe Scholar",
  metadataCopy: "Sunset Strip, 1987. You were there.",
  memberSince: "March 2026",
};

const MOCK_HEADLINE = {
  puzzles: 47,
  streak: 5,
  best: 950,
  avg: 612,
};

const MOCK_GENRE_DATA = [
  { genre: "Hair Metal", value: 18, fullMark: 18 },
  { genre: "Classic Rock", value: 11, fullMark: 18 },
  { genre: "80s", value: 9, fullMark: 18 },
  { genre: "70s", value: 4, fullMark: 18 },
  { genre: "90s", value: 3, fullMark: 18 },
  { genre: "Pop", value: 2, fullMark: 18 },
];

const MOCK_STATS = {
  currentStreak: 5,
  longestStreak: 12,
  totalPlayed: 47,
  totalSolved: 38,
  winRate: 81,
  avgScore: 612,
  bestScore: 950,
  perfectGames: 7,
  avgClue: 4.2,
  graceSaves: 3,
};

const MOCK_TITLES = [
  { title: "Hair Metal Master", tier: 1, date: "Apr 8, 2026", active: true },
  { title: "Crüe Scholar", tier: 1, date: "Apr 3, 2026", active: false },
  { title: "80s Initiate", tier: 1, date: "Mar 28, 2026", active: false },
];

const MOCK_HISTORY = [
  { date: "Apr 12, 2026", mode: "Artist", subject: "Warrant", genre: "Hair Metal", solved: true, score: 850, clue: 3, wrong: 0 },
  { date: "Apr 12, 2026", mode: "Artist", subject: "Bon Jovi", genre: "Hair Metal", solved: true, score: 950, clue: 2, wrong: 0 },
  { date: "Apr 11, 2026", mode: "Artist", subject: "Fleetwood Mac", genre: "Classic Rock", solved: true, score: 700, clue: 5, wrong: 1 },
  { date: "Apr 11, 2026", mode: "Artist", subject: "The Cure", genre: "80s", solved: false, score: 0, clue: null, wrong: 4 },
  { date: "Apr 10, 2026", mode: "Artist", subject: "Ratt", genre: "Hair Metal", solved: true, score: 600, clue: 5, wrong: 2 },
  { date: "Apr 10, 2026", mode: "Artist", subject: "Prince", genre: "Pop", solved: true, score: 450, clue: 7, wrong: 1 },
  { date: "Apr 9, 2026", mode: "Artist", subject: "Led Zeppelin", genre: "Classic Rock", solved: true, score: 800, clue: 3, wrong: 0 },
  { date: "Apr 9, 2026", mode: "Artist", subject: "Mötley Crüe", genre: "Hair Metal", solved: true, score: 950, clue: 1, wrong: 0 },
  { date: "Apr 8, 2026", mode: "Artist", subject: "Quiet Riot", genre: "Hair Metal", solved: true, score: 750, clue: 4, wrong: 1 },
  { date: "Apr 8, 2026", mode: "Artist", subject: "Eagles", genre: "Classic Rock", solved: true, score: 500, clue: 6, wrong: 2 },
  { date: "Apr 7, 2026", mode: "Artist", subject: "Scorpions", genre: "Hair Metal", solved: true, score: 650, clue: 5, wrong: 1 },
  { date: "Apr 7, 2026", mode: "Artist", subject: "David Bowie", genre: "Classic Rock", solved: false, score: 0, clue: null, wrong: 3 },
  { date: "Apr 6, 2026", mode: "Artist", subject: "Poison", genre: "Hair Metal", solved: true, score: 900, clue: 2, wrong: 0 },
  { date: "Apr 5, 2026", mode: "Artist", subject: "Cinderella", genre: "Hair Metal", solved: true, score: 800, clue: 3, wrong: 0 },
  { date: "Apr 4, 2026", mode: "Artist", subject: "Twisted Sister", genre: "Hair Metal", solved: true, score: 550, clue: 6, wrong: 2 },
];

const TIER_LABELS = { 1: "T1", 2: "T2", 3: "T3", 4: "T4", 5: "T5" };

function TierBadge({ tier, small = false }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${small ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"}`}
      style={{ background: "#faeeda", color: "#854f0b" }}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

function SectionDivider() {
  return <div className="w-full h-px my-8" style={{ background: "rgba(0,0,0,0.08)" }} />;
}

export default function ProfilePage() {
  const [historyCount, setHistoryCount] = useState(8);
  const visibleHistory = MOCK_HISTORY.slice(0, historyCount);

  return (
    <div className="min-h-screen w-full" style={{ background: "#FAFAF8", color: "#252018" }}>
      <div className="max-w-xl mx-auto px-5 py-8">

        {/* ===== TITLE HERO ===== */}
        <section className="text-center mb-2 pt-4">
          <div className="mb-3">
            <TierBadge tier={MOCK_PLAYER.tier} />
          </div>
          <h1
            className="text-4xl leading-tight mb-2"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
          >
            {MOCK_PLAYER.title}
          </h1>
          {MOCK_PLAYER.depthLabel && (
            <p className="text-base mb-3" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>
              {MOCK_PLAYER.depthLabel}
            </p>
          )}
          <p
            className="text-sm italic mt-4 leading-relaxed"
            style={{ color: "#b45309", fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.05rem" }}
          >
            "{MOCK_PLAYER.metadataCopy}"
          </p>
        </section>

        <SectionDivider />

        {/* ===== HEADLINE STATS ===== */}
        <section className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: "Puzzles", value: MOCK_HEADLINE.puzzles },
            { label: "Streak", value: MOCK_HEADLINE.streak },
            { label: "Best", value: MOCK_HEADLINE.best.toLocaleString() },
            { label: "Avg", value: MOCK_HEADLINE.avg },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {s.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "#737373" }}>
                {s.label}
              </div>
            </div>
          ))}
        </section>

        <SectionDivider />

        {/* ===== GENRE RADAR ===== */}
        <section>
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
          >
            Taste fingerprint
          </h2>
          <div className="w-full" style={{ aspectRatio: "1 / 1", maxHeight: "340px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MOCK_GENRE_DATA}>
                <PolarGrid stroke="rgba(0,0,0,0.08)" />
                <PolarAngleAxis
                  dataKey="genre"
                  tick={{ fontSize: 12, fill: "#737373", fontFamily: "'DM Sans', sans-serif" }}
                />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar
                  name="Genres"
                  dataKey="value"
                  stroke="#b45309"
                  fill="#b45309"
                  fillOpacity={0.18}
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#b45309", strokeWidth: 0 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <SectionDivider />

        {/* ===== STREAKS & SCORING ===== */}
        <section>
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
          >
            The numbers
          </h2>
          <div className="space-y-3">
            {[
              { label: "Current streak", value: MOCK_STATS.currentStreak },
              { label: "Longest streak", value: MOCK_STATS.longestStreak },
              { label: "Puzzles played", value: MOCK_STATS.totalPlayed },
              { label: "Puzzles solved", value: MOCK_STATS.totalSolved },
              { label: "Win rate", value: `${MOCK_STATS.winRate}%` },
              { label: "Average score", value: MOCK_STATS.avgScore },
              { label: "Best score", value: MOCK_STATS.bestScore.toLocaleString() },
              { label: "Perfect games", value: MOCK_STATS.perfectGames },
              { label: "Avg clue at guess", value: MOCK_STATS.avgClue },
              { label: "Grace period saves", value: MOCK_STATS.graceSaves },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
              >
                <span className="text-sm" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>
                  {row.label}
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ===== TITLE TIMELINE ===== */}
        <section>
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
          >
            Title progression
          </h2>
          <div className="relative pl-6">
            <div
              className="absolute left-2 top-2 bottom-2 w-px"
              style={{ background: "rgba(0,0,0,0.1)" }}
            />
            {MOCK_TITLES.map((t, i) => (
              <div key={i} className="relative flex items-start gap-3 mb-5 last:mb-0">
                <div
                  className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full border-2"
                  style={{
                    borderColor: t.active ? "#b45309" : "rgba(0,0,0,0.15)",
                    background: t.active ? "#b45309" : "#FAFAF8",
                  }}
                />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${!t.active ? "opacity-50" : ""}`}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {t.title}
                    </span>
                    <TierBadge tier={t.tier} small />
                    {t.active && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "#f0fdf4", color: "#15803d" }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "#a3a3a3" }}>
                    {t.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ===== PUZZLE HISTORY ===== */}
        <section>
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
          >
            History
          </h2>
          <div className="space-y-1">
            {visibleHistory.map((p, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 py-3 ${!p.solved ? "opacity-45" : ""}`}
                style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {p.subject}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(0,0,0,0.04)", color: "#737373", whiteSpace: "nowrap" }}
                    >
                      {p.genre}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#a3a3a3" }}>
                    {p.date}
                    {p.solved
                      ? ` · Clue ${p.clue} of 9 · ${p.wrong === 0 ? "Perfect" : `${p.wrong} wrong`}`
                      : " · Gave up"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {p.solved ? (
                    <span className="text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {p.score.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "#a3a3a3" }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {historyCount < MOCK_HISTORY.length && (
            <button
              onClick={() => setHistoryCount((c) => Math.min(c + 8, MOCK_HISTORY.length))}
              className="w-full mt-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
              style={{
                background: "transparent",
                border: "1px solid rgba(0,0,0,0.12)",
                color: "#737373",
                cursor: "pointer",
              }}
            >
              Show more
            </button>
          )}
        </section>

        {/* ===== FOOTER SPACER ===== */}
        <div className="h-16" />
      </div>
    </div>
  );
}
