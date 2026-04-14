"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface BadgeData {
  name: string;
  description: string | null;
  rarity: string | null;
  displayOrder: number | null;
  earnedAt?: string | null;
}

interface GenreTrack {
  genre: string;
  level: number;
  levelName: string;
  earnedAt: string | null;
}

interface TitleEntry {
  name: string;
  titleType: string | null;
  description: string | null;
  earnedAt: string | null;
  isDisplayed?: boolean | null;
}

interface DisplayedTitle {
  name: string;
  titleType: string | null;
  tier: number;
  level: number | null;
  genre: string | null;
  description: string | null;
}

interface ProfileData {
  stats: {
    currentStreak: number;
    longestStreak: number;
    currentDayStreak: number;
    longestDayStreak: number;
    totalPlayed: number;
    totalSolved: number;
    winRate: number;
    avgScore: number;
    bestScore: number;
    perfectGames: number;
    avgClue: number;
  };
  headline: {
    puzzles: number;
    streak: number;
    best: number;
    avg: number;
  };
  genreRadar: { genre: string; value: number; fullMark: number }[];
  history: {
    date: string;
    mode: string;
    subject: string;
    genre: string;
    solved: boolean;
    score: number;
    clue: number | null;
    totalSongs: number;
    wrong: number;
  }[];
  badges: {
    earned: BadgeData[];
    all: BadgeData[];
  };
  titles: {
    displayed: DisplayedTitle | null;
    genreTracks: GenreTrack[];
    depthTitles: TitleEntry[];
    higherTitles: TitleEntry[];
  };
}

const RARITY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: "rgba(0,0,0,0.03)", border: "rgba(0,0,0,0.08)", text: "#737373" },
  uncommon: { bg: "#fef9ee", border: "#e8c97a", text: "#854f0b" },
  rare: { bg: "#faeeda", border: "#b45309", text: "#854f0b" },
  epic: { bg: "#b45309", border: "#92400e", text: "#ffffff" },
};

const GENRE_DISPLAY_NAMES: Record<string, string> = {
  "hair-metal": "Hair Metal",
  "classic-rock": "Classic Rock",
  pop: "Pop",
  "hip-hop": "Hip-Hop",
  country: "Country",
  metal: "Metal",
  punk: "Punk",
  jazz: "Jazz",
  blues: "Blues",
  electronic: "Electronic",
  "r-and-b": "R&B",
  "rnb-soul": "R&B",
  indie: "Indie",
  rock: "Rock",
  reggae: "Reggae",
  latin: "Latin",
  folk: "Folk",
  motown: "Motown",
  "brit-pop": "Brit Pop",
  grunge: "Grunge",
  "new-wave": "New Wave",
  "disco-funk": "Disco/Funk",
  "singer-songwriter": "Singer-Songwriter",
  "southern-rock": "Southern Rock",
  "prog-rock": "Prog Rock",
  emo: "Emo",
  "nu-metal": "Nu Metal",
};

const TITLE_TYPE_LABELS: Record<string, string> = {
  genre: "Genre Mastery",
  fusion: "Fusion",
  convergence: "Convergence",
  depth_artist: "Artist Depth",
  depth_album: "Album Depth",
  era_purist: "Era Purist",
  global: "Global Supremacy",
  editorial: "Editorial",
  bestowed: "The Bestowed",
};

const MAX_LEVEL = 5;

function genreLabel(slug: string): string {
  return (
    GENRE_DISPLAY_NAMES[slug] ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

function SectionDivider() {
  return (
    <div
      className="w-full h-px my-8"
      style={{ background: "rgba(0,0,0,0.08)" }}
    />
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="hover:text-[#b45309] transition-colors">
      {children}
    </a>
  );
}

function NavDot() {
  return (
    <span className="mx-2" aria-hidden="true">
      &middot;
    </span>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyCount, setHistoryCount] = useState(8);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && !profile) {
      fetch("/api/profile")
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load");
          return r.json();
        })
        .then((data) => {
          setProfile(data);
          setLoading(false);
        })
        .catch(() => {
          setError("Could not load profile.");
          setLoading(false);
        });
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAF8" }}>
        <div className="text-center">
          <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.5rem", color: "#1a1a1a" }}>
            Deep Cut
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#737373", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAF8" }}>
        <div className="text-center">
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#737373", fontSize: "0.875rem" }}>
            {error || "Something went wrong."}
          </p>
          <a href="/play" style={{ display: "inline-block", marginTop: "1rem", color: "#b45309", fontSize: "0.875rem", fontWeight: 500 }}>
            &larr; Back to game
          </a>
        </div>
      </div>
    );
  }

  const { stats, headline, genreRadar, history, badges, titles } = profile;
  const visibleHistory = history.slice(0, historyCount);
  const hasData = stats.totalPlayed > 0;
  const earnedNames = new Set(badges.earned.map((b) => b.name));
  const displayedTitle = titles?.displayed;
  const genreTracks = titles?.genreTracks || [];
  const depthTitles = titles?.depthTitles || [];
  const higherTitles = titles?.higherTitles || [];
  const hasAnyTitles = genreTracks.length > 0 || depthTitles.length > 0 || higherTitles.length > 0;

  return (
    <div className="min-h-screen w-full" style={{ background: "#FAFAF8", color: "#252018" }}>
      <div className="max-w-xl mx-auto px-5 py-8">

        {/* ===== TITLE HERO ===== */}
        <section className="text-center mb-2 pt-4">
          {displayedTitle ? (
            <>
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#b45309", fontFamily: "'DM Sans', sans-serif" }}>
                {TITLE_TYPE_LABELS[displayedTitle.titleType || "genre"] || "Title"}
              </p>
              <h1 className="text-4xl leading-tight mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                {displayedTitle.name}
              </h1>
              {displayedTitle.description && (
                <p className="text-sm italic mb-2" style={{ color: "#b45309", fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  {displayedTitle.description}
                </p>
              )}
              <p className="text-sm" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>
                {session?.user?.email}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl leading-tight mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                {hasData ? "Your Profile" : "Deep Cut"}
              </h1>
              <p className="text-sm" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>
                {session?.user?.email}
              </p>
              {!hasData && (
                <p className="text-sm italic mt-4" style={{ color: "#b45309", fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Keep playing. The game is watching.
                </p>
              )}
            </>
          )}
        </section>

        <SectionDivider />

        {/* ===== HEADLINE STATS ===== */}
        <section className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: "Puzzles", value: headline.puzzles },
            { label: "Streak", value: headline.streak },
            { label: "Best", value: headline.best > 0 ? headline.best.toLocaleString() : "\u2014" },
            { label: "Avg", value: headline.avg > 0 ? headline.avg : "\u2014" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "#737373" }}>{s.label}</div>
            </div>
          ))}
        </section>

        <SectionDivider />

        {/* ===== CHARACTER SHEET — Genre Tracks ===== */}
        <section>
          <h2 className="text-lg mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Genre mastery
          </h2>
          <p className="text-xs mb-5" style={{ color: "#737373" }}>
            {genreTracks.length > 0
              ? `${genreTracks.length} genre${genreTracks.length === 1 ? "" : "s"} in progress`
              : "Win a puzzle to start your first track"}
          </p>

          {genreTracks.length > 0 ? (
            <div className="space-y-3">
              {genreTracks.map((track) => {
                const isDisplayed = displayedTitle?.titleType === "genre" && displayedTitle?.genre === track.genre;
                return (
                  <div key={track.genre}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium"
                          style={{ fontFamily: "'DM Sans', sans-serif", color: isDisplayed ? "#b45309" : "#252018" }}
                        >
                          {genreLabel(track.genre)}
                        </span>
                        {isDisplayed && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "#b45309", color: "#fff", fontSize: "0.6rem" }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>
                        Lv {track.level} &middot; {track.levelName}
                      </span>
                    </div>
                    {/* Level bar */}
                    <div className="flex gap-1">
                      {Array.from({ length: MAX_LEVEL }, (_, i) => (
                        <div
                          key={i}
                          className="h-[6px] rounded-full flex-1 transition-colors"
                          style={{
                            background: i < track.level ? "#b45309" : "rgba(0,0,0,0.06)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm py-2" style={{ color: "#a3a3a3" }}>
              No genres unlocked yet. Go play.
            </p>
          )}

          {/* Depth titles */}
          {depthTitles.length > 0 && (
            <div className="mt-6">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>
                Depth titles
              </p>
              <div className="space-y-2">
                {depthTitles.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <div>
                      <span className="text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {t.name}
                      </span>
                      <span className="text-xs ml-2" style={{ color: "#a3a3a3" }}>
                        {TITLE_TYPE_LABELS[t.titleType || ""] || t.titleType}
                      </span>
                    </div>
                    {t.earnedAt && (
                      <span className="text-xs" style={{ color: "#a3a3a3" }}>
                        {new Date(t.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Higher-order titles (Fusion, Convergence, Global) */}
          {higherTitles.length > 0 && (
            <div className="mt-6">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>
                Higher-order titles
              </p>
              <div className="space-y-2">
                {higherTitles.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif", color: t.isDisplayed ? "#b45309" : "#252018" }}>
                        {t.name}
                      </span>
                      <span className="text-xs" style={{ color: "#a3a3a3" }}>
                        {TITLE_TYPE_LABELS[t.titleType || ""] || t.titleType}
                      </span>
                      {t.isDisplayed && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#b45309", color: "#fff", fontSize: "0.6rem" }}>
                          Active
                        </span>
                      )}
                    </div>
                    {t.earnedAt && (
                      <span className="text-xs" style={{ color: "#a3a3a3" }}>
                        {new Date(t.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <SectionDivider />

        {/* ===== BADGES ===== */}
        <section>
          <h2 className="text-lg mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Badges
          </h2>
          <p className="text-xs mb-4" style={{ color: "#737373" }}>
            {badges.earned.length} / {badges.all.length} earned
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {badges.all.map((badge) => {
              const isEarned = earnedNames.has(badge.name);
              const rarity = badge.rarity || "common";
              const rs = RARITY_STYLES[rarity] || RARITY_STYLES.common;
              const earnedBadge = badges.earned.find((b) => b.name === badge.name);

              return (
                <div
                  key={badge.name}
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    background: isEarned ? rs.bg : "rgba(0,0,0,0.02)",
                    border: "1px solid " + (isEarned ? rs.border : "rgba(0,0,0,0.06)"),
                    opacity: isEarned ? 1 : 0.4,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif", color: isEarned ? rs.text : "#a3a3a3" }}>
                      {badge.name}
                    </span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: isEarned ? rs.text : "#a3a3a3", opacity: isEarned ? 0.8 : 0.6 }}>
                    {badge.description}
                  </p>
                  {isEarned && earnedBadge?.earnedAt && (
                    <p className="text-xs mt-1" style={{ color: rs.text, opacity: 0.5 }}>
                      {new Date(earnedBadge.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <SectionDivider />

        {/* ===== GENRE RADAR ===== */}
        <section>
          <h2 className="text-lg mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Taste fingerprint
          </h2>
          {genreRadar.length >= 3 ? (
            <div className="w-full" style={{ aspectRatio: "1 / 1", maxHeight: "340px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={genreRadar}>
                  <PolarGrid stroke="rgba(0,0,0,0.08)" />
                  <PolarAngleAxis dataKey="genre" tick={{ fontSize: 12, fill: "#737373", fontFamily: "'DM Sans', sans-serif" }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name="Genres" dataKey="value" stroke="#b45309" fill="#b45309" fillOpacity={0.18} strokeWidth={2} dot={{ r: 4, fill: "#b45309", strokeWidth: 0 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm py-6 text-center" style={{ color: "#737373" }}>
              Play across genres to reveal your taste fingerprint.
            </p>
          )}
        </section>

        <SectionDivider />

        {/* ===== STREAKS & SCORING ===== */}
        <section>
          <h2 className="text-lg mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            The numbers
          </h2>
          <div className="space-y-3">
            {[
              { label: "Win streak", value: stats.currentStreak },
              { label: "Best win streak", value: stats.longestStreak },
              { label: "Day streak", value: stats.currentDayStreak },
              { label: "Best day streak", value: stats.longestDayStreak },
              { label: "Puzzles played", value: stats.totalPlayed },
              { label: "Puzzles solved", value: stats.totalSolved },
              { label: "Win rate", value: hasData ? stats.winRate + "%" : "\u2014" },
              { label: "Average score", value: stats.avgScore > 0 ? stats.avgScore : "\u2014" },
              { label: "Best score", value: stats.bestScore > 0 ? stats.bestScore.toLocaleString() : "\u2014" },
              { label: "Perfect games", value: stats.perfectGames },
              { label: "Avg clue at guess", value: stats.avgClue > 0 ? stats.avgClue : "\u2014" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <span className="text-sm" style={{ color: "#737373", fontFamily: "'DM Sans', sans-serif" }}>{row.label}</span>
                <span className="text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ===== PUZZLE HISTORY ===== */}
        <section>
          <h2 className="text-lg mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            History
          </h2>
          {history.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: "#737373" }}>Nothing here yet. Go play.</p>
              <a href="/play" className="inline-block mt-3 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#b45309" }}>
                Play
              </a>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {visibleHistory.map((p, i) => (
                  <div key={i} className={"flex items-center gap-3 py-3" + (!p.solved ? " opacity-45" : "")} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.subject}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.04)", color: "#737373", whiteSpace: "nowrap" }}>{p.genre}</span>
                        {p.mode === "Album" && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#b45309", color: "#fff", fontSize: "0.625rem", whiteSpace: "nowrap" }}>Album</span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "#a3a3a3" }}>
                        {p.date}
                        {p.solved
                          ? " \u00B7 Clue " + p.clue + " of " + p.totalSongs + " \u00B7 " + (p.wrong === 0 ? "Perfect" : p.wrong + " wrong")
                          : " \u00B7 Gave up"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {p.solved ? (
                        <span className="text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.score.toLocaleString()}</span>
                      ) : (
                        <span className="text-xs" style={{ color: "#a3a3a3" }}>{"\u2014"}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {historyCount < history.length && (
                <button
                  onClick={() => setHistoryCount((c) => Math.min(c + 8, history.length))}
                  className="w-full mt-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  style={{ background: "transparent", border: "1px solid rgba(0,0,0,0.12)", color: "#737373", cursor: "pointer" }}
                >
                  Show more
                </button>
              )}
            </>
          )}
        </section>

        {/* ===== NAV FOOTER ===== */}
        <nav className="mt-10 text-center text-xs" style={{ color: "#737373" }}>
          <NavLink href="/play">Play</NavLink>
          <NavDot />
          <NavLink href="/genres">Genres</NavLink>
          <NavDot />
          <NavLink href="/leaderboard">Leaderboard</NavLink>
        </nav>

        <div className="h-16" />
      </div>
    </div>
  );
}
