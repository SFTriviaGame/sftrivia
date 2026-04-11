"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

interface PuzzleSong {
  order: number;
  name: string;
}

interface PuzzleData {
  id: string;
  mode: string;
  genre: string;
  tags: string[];
  songs: PuzzleSong[];
  answer: string;
  answerNormalized: string;
  totalSongs: number;
  availableTags: string[];
}

type GameState = "loading" | "ready" | "preview" | "playing" | "grace" | "won" | "lost";

// ── Fuzzy matching ──────────────────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= b.length; j++) {
      if (i === 0) {
        matrix[i][j] = j;
      } else {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

function isCorrectGuess(guess: string, answer: string): boolean {
  const ng = normalize(guess);
  const na = normalize(answer);
  if (ng === na) return true;
  const ngNoThe = ng.replace(/^the /, "");
  const naNoThe = na.replace(/^the /, "");
  if (ngNoThe === naNoThe) return true;
  const maxDist = na.length <= 8 ? 1 : 2;
  if (levenshtein(ng, na) <= maxDist) return true;
  if (levenshtein(ngNoThe, naNoThe) <= maxDist) return true;
  return false;
}

// ── Constants ───────────────────────────────────────────────────────────────

const TIMER_SECONDS = 45;
const GRACE_SECONDS = 3;
const REVEAL_INTERVAL = 3;
const PREVIEW_SECONDS = 3;
const SCORE_MAX = 1000;
const SCORE_FLOOR = 50;
const WRONG_PENALTY = 50;
const DECAY_PER_SECOND = (SCORE_MAX - SCORE_FLOOR) / TIMER_SECONDS;

// ── Tag display config ──────────────────────────────────────────────────────

const TAG_LABELS: Record<string, string> = {
  "all": "All",
  "70s": "70s",
  "80s": "80s",
  "90s": "90s",
  "pop": "Pop",
  "classic-rock": "Classic Rock",
  "hair-metal": "Hair Metal",
};

const TAG_ORDER = ["all", "70s", "80s", "90s", "pop", "classic-rock", "hair-metal"];

// ── Styles ──────────────────────────────────────────────────────────────────

const injectedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

  .font-display { font-family: 'Instrument Serif', Georgia, serif; }
  .font-body { font-family: 'DM Sans', system-ui, sans-serif; }

  @keyframes slideReveal {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shakeX {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }
  @keyframes scorePop {
    0% { transform: scale(1); }
    50% { transform: scale(1.12); }
    100% { transform: scale(1); }
  }

  .animate-slide-reveal { animation: slideReveal 0.3s ease-out both; }
  .animate-fade-up { animation: fadeUp 0.35s ease-out both; }
  .animate-shake { animation: shakeX 0.4s ease-out; }
  .animate-score-pop { animation: scorePop 0.3s ease-out; }

  @media (prefers-reduced-motion: reduce) {
    .animate-slide-reveal, .animate-fade-up, .animate-shake, .animate-score-pop {
      animation: none !important;
    }
  }

  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }

  *:focus-visible {
    outline: 2px solid #b45309;
    outline-offset: 2px;
    border-radius: 4px;
  }
  input:focus-visible { outline: none; }
`;

// ── LocalStorage helpers ────────────────────────────────────────────────────

function getStoredScore(): { total: number; played: number; won: number } {
  if (typeof window === "undefined") return { total: 0, played: 0, won: 0 };
  try {
    const raw = localStorage.getItem("deepcut_score");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { total: 0, played: 0, won: 0 };
}

function saveScore(total: number, played: number, won: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("deepcut_score", JSON.stringify({ total, played, won }));
  } catch {}
}

// ── Component ───────────────────────────────────────────────────────────────

export default function PlayPage() {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [revealedCount, setRevealedCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(TIMER_SECONDS);
  const [graceRemaining, setGraceRemaining] = useState(GRACE_SECONDS);
  const [guess, setGuess] = useState("");
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [score, setScore] = useState(SCORE_MAX);
  const [finalScore, setFinalScore] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [guessHistory, setGuessHistory] = useState<string[]>([]);
  const [songsUsed, setSongsUsed] = useState(0);
  const [scorePop, setScorePop] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTag, setSelectedTag] = useState("all");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sessionScore, setSessionScore] = useState({ total: 0, played: 0, won: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const revealRef = useRef<NodeJS.Timeout | null>(null);
  const songListRef = useRef<HTMLDivElement>(null);

  // ── Load stored score on mount ──────────────────────────────────────────

  useEffect(() => {
    setSessionScore(getStoredScore());
  }, []);

  // ── Fetch puzzle ────────────────────────────────────────────────────────

  const fetchPuzzle = useCallback((tag: string) => {
    const params = tag && tag !== "all" ? `?tag=${encodeURIComponent(tag)}&t=${Date.now()}` : `?t=${Date.now()}`;
    return fetch(`/api/puzzle${params}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
    })
      .then((r) => r.json())
      .then((data: PuzzleData) => {
        setPuzzle(data);
        if (data.availableTags) setAvailableTags(data.availableTags);
        return data;
      });
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPuzzle("all")
      .then(() => setGameState("ready"))
      .catch(console.error);
  }, [fetchPuzzle]);

  // ── Start game (goes through preview) ───────────────────────────────────

  const startGame = () => {
    setRevealedCount(1);
    setGameState("preview");
  };

  // ── Preview timer — 3 seconds then playing ─────────────────────────────

  useEffect(() => {
    if (gameState !== "preview") return;
    const t = setTimeout(() => setGameState("playing"), PREVIEW_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [gameState]);

  // ── Load next puzzle (skips intro, goes through preview) ────────────────

  const loadNextPuzzle = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (revealRef.current) clearInterval(revealRef.current);
    setPuzzle(null);
    setGameState("loading");
    setRevealedCount(0);
    setTimeRemaining(TIMER_SECONDS);
    setGraceRemaining(GRACE_SECONDS);
    setGuess("");
    setWrongGuesses(0);
    setScore(SCORE_MAX);
    setFinalScore(0);
    setWrongFlash(false);
    setGuessHistory([]);
    setSongsUsed(0);
    setScorePop(false);
    setCopied(false);
    fetchPuzzle(selectedTag)
      .then(() => {
        setRevealedCount(1);
        setGameState("preview");
      })
      .catch(console.error);
  };

  // ── Change category (goes to start screen) ─────────────────────────────

  const changeCategory = (tag: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (revealRef.current) clearInterval(revealRef.current);
    setSelectedTag(tag);
    setPuzzle(null);
    setGameState("loading");
    setRevealedCount(0);
    setTimeRemaining(TIMER_SECONDS);
    setGraceRemaining(GRACE_SECONDS);
    setGuess("");
    setWrongGuesses(0);
    setScore(SCORE_MAX);
    setFinalScore(0);
    setWrongFlash(false);
    setGuessHistory([]);
    setSongsUsed(0);
    fetchPuzzle(tag)
      .then(() => setGameState("ready"))
      .catch(console.error);
  };

  // ── Timers ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); setGameState("grace"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "grace") return;
    const t = setInterval(() => {
      setGraceRemaining((prev) => {
        if (prev <= 1) { clearInterval(t); setGameState("lost"); setFinalScore(0); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing" && gameState !== "grace") return;
    if (!puzzle) return;
    revealRef.current = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= puzzle.totalSongs) { clearInterval(revealRef.current!); return prev; }
        return prev + 1;
      });
    }, REVEAL_INTERVAL * 1000);
    return () => { if (revealRef.current) clearInterval(revealRef.current); };
  }, [gameState, puzzle]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!songListRef.current) return;
    if (revealedCount > 0) {
      songListRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [revealedCount]);

  // ── Score ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState === "playing") {
      const elapsed = TIMER_SECONDS - timeRemaining;
      const raw = SCORE_MAX - elapsed * DECAY_PER_SECOND;
      setScore(Math.max(SCORE_FLOOR, Math.round(raw - wrongGuesses * WRONG_PENALTY)));
    } else if (gameState === "grace") {
      setScore(SCORE_FLOOR);
    }
  }, [timeRemaining, wrongGuesses, gameState]);

  // ── Track score on game end ─────────────────────────────────────────────

  useEffect(() => {
    if (gameState === "won" || gameState === "lost") {
      const prev = getStoredScore();
      const updated = {
        total: prev.total + (gameState === "won" ? finalScore : 0),
        played: prev.played + 1,
        won: prev.won + (gameState === "won" ? 1 : 0),
      };
      saveScore(updated.total, updated.played, updated.won);
      setSessionScore(updated);
    }
  }, [gameState, finalScore]);

  // ── Focus ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState === "playing" || gameState === "grace") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [gameState]);

  // ── Guess ───────────────────────────────────────────────────────────────

  const handleGuess = useCallback(() => {
    if (!puzzle || !guess.trim()) return;
    if (gameState !== "playing" && gameState !== "grace") return;
    const trimmed = guess.trim();

    if (isCorrectGuess(trimmed, puzzle.answer)) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (revealRef.current) clearInterval(revealRef.current);
      const earned = gameState === "grace" ? SCORE_FLOOR : score;
      setFinalScore(earned);
      setSongsUsed(revealedCount);
      setRevealedCount(puzzle.totalSongs);
      setGameState("won");
      setScorePop(true);
      setTimeout(() => setScorePop(false), 400);
    } else {
      setGuessHistory((prev) => [...prev, trimmed]);
      setWrongGuesses((prev) => prev + 1);
      setGuess("");
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
    }
  }, [puzzle, guess, gameState, score, revealedCount]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleGuess(); }
  };

  // ── Share ───────────────────────────────────────────────────────────────

  const handleShare = () => {
    if (!puzzle) return;
    const blocks = puzzle.songs.map((_, i) => {
      if (gameState === "won" && i < songsUsed) return i === songsUsed - 1 ? "🟩" : "⬛";
      if (gameState === "lost") return "⬛";
      return "⬜";
    });
    const text = [`🎵 Deep Cut`, blocks.join(""),
      gameState === "won" ? `${finalScore} pts — clue ${songsUsed}/${puzzle.totalSongs}` : `❌ Could not guess`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Derived ─────────────────────────────────────────────────────────────

  const isActive = gameState === "playing" || gameState === "grace";
  const isFinished = gameState === "won" || gameState === "lost";
  const isUrgent = gameState === "grace" || (gameState === "playing" && timeRemaining <= 10);
  const timerPercent = gameState === "grace" ? (graceRemaining / GRACE_SECONDS) * 100
    : gameState === "playing" ? (timeRemaining / TIMER_SECONDS) * 100
    : gameState === "preview" ? 100 : 0;

  // Sorted tags for display
  const displayTags = ["all", ...availableTags].sort((a, b) => {
    const ai = TAG_ORDER.indexOf(a);
    const bi = TAG_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // ── Loading ─────────────────────────────────────────────────────────────

  if (gameState === "loading" || !puzzle) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
        <main className="min-h-dvh bg-[#FAFAF8] flex items-center justify-center" role="status">
          <p className="font-body text-[#6b6b6b] text-sm tracking-wide">Loading puzzle...</p>
        </main>
      </>
    );
  }

  // ── Start screen ────────────────────────────────────────────────────────

  if (gameState === "ready") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
        <main className="min-h-dvh bg-[#FAFAF8] flex flex-col items-center justify-center px-6">
          <div className="animate-fade-up text-center max-w-sm w-full">
            <p className="font-body text-[11px] tracking-[5px] text-[#6b6b6b] uppercase mb-3">
              Daily Puzzle
            </p>
            <h1 className="font-display text-5xl sm:text-6xl text-[#1a1a1a] mb-2 leading-[1.1]">
              Deep Cut
            </h1>
            <p className="font-display text-lg sm:text-xl text-[#6b6b6b] italic mb-8">
              Name the Artist
            </p>

            {/* Running score */}
            {sessionScore.played > 0 && (
              <div className="flex justify-center gap-6 mb-8 font-body text-xs text-[#6b6b6b]">
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums">{sessionScore.total.toLocaleString()}</p>
                  <p>total pts</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums">{sessionScore.won}/{sessionScore.played}</p>
                  <p>won</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums">
                    {sessionScore.played > 0 ? Math.round(sessionScore.total / sessionScore.played) : 0}
                  </p>
                  <p>avg</p>
                </div>
              </div>
            )}

            {/* Category picker */}
            <div className="mb-8">
              <p className="font-body text-[10px] tracking-[3px] text-[#8b8b8b] uppercase mb-3">Category</p>
              <div className="flex flex-wrap justify-center gap-2">
                {displayTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (tag !== selectedTag) changeCategory(tag);
                    }}
                    className={`
                      font-body text-xs px-3 py-1.5 rounded-full border transition-all
                      ${tag === selectedTag
                        ? "bg-[#b45309] text-white border-[#b45309]"
                        : "bg-transparent text-[#4a4a4a] border-[#d5d0c7] hover:border-[#b45309] hover:text-[#b45309]"
                      }
                    `}
                  >
                    {TAG_LABELS[tag] || tag}
                  </button>
                ))}
              </div>
            </div>

            {/* How to play */}
            <ol className="space-y-3 mb-8 text-left list-none" aria-label="How to play">
              <li className="flex items-start gap-3">
                <span className="font-body text-[11px] text-[#9a6400] font-semibold mt-0.5 w-4 text-right shrink-0" aria-hidden="true">01</span>
                <p className="font-body text-sm text-[#4a4a4a]">Songs reveal one at a time — deep cuts first, hits last</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-body text-[11px] text-[#9a6400] font-semibold mt-0.5 w-4 text-right shrink-0" aria-hidden="true">02</span>
                <p className="font-body text-sm text-[#4a4a4a]">Type your guess whenever you think you know the artist</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-body text-[11px] text-[#9a6400] font-semibold mt-0.5 w-4 text-right shrink-0" aria-hidden="true">03</span>
                <p className="font-body text-sm text-[#4a4a4a]">The earlier you guess correctly, the higher your score</p>
              </li>
            </ol>

            <button
              onClick={startGame}
              className="font-body w-full py-3.5 rounded-lg text-sm font-semibold tracking-wide uppercase
                bg-[#b45309] text-white hover:bg-[#a14a08]
                active:scale-[0.97] transition-all duration-150"
            >
              Play
            </button>

            <p className="font-body text-xs text-[#8b8b8b] mt-4">
              {puzzle.totalSongs} clues · {TIMER_SECONDS} seconds
            </p>
          </div>
        </main>
      </>
    );
  }

  // ── Game (preview + playing + grace + results) ──────────────────────────

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
      <div className="min-h-dvh bg-[#FAFAF8] text-[#1a1a1a] flex flex-col font-body">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#e8e5de]">
          <div className="max-w-lg mx-auto px-4 pt-3 pb-3">
            {/* Back to menu */}
            {!isFinished && (
              <button
                onClick={() => changeCategory(selectedTag)}
                className="text-[10px] text-[#8b8b8b] hover:text-[#4a4a4a] mb-2 transition-colors"
              >
                ← Menu
              </button>
            )}

            {/* Title + score */}
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <p className="text-[10px] tracking-[4px] text-[#8b8b8b] uppercase" aria-hidden="true">Deep Cut</p>
                <h1 className="font-display text-xl tracking-tight text-[#1a1a1a]">Name the Artist</h1>
                {selectedTag !== "all" && (
                  <p className="text-[10px] text-[#b45309] tracking-wide">{TAG_LABELS[selectedTag] || selectedTag}</p>
                )}
              </div>
              <div className="text-right" aria-live="polite">
                <p
                  className={`text-3xl font-bold tabular-nums leading-none transition-colors duration-300 ${scorePop ? "animate-score-pop" : ""}`}
                  style={{
                    color: isFinished
                      ? gameState === "won" ? "#15803d" : "#8b8b8b"
                      : isUrgent ? "#b91c1c" : "#1a1a1a",
                  }}
                  aria-label={`Score: ${isFinished ? finalScore : score}`}
                >
                  {isFinished ? finalScore : score}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: isUrgent && isActive ? "#b91c1c" : "#6b6b6b" }}>
                  {gameState === "preview" && <span className="text-[#b45309]">Get ready...</span>}
                  {gameState === "grace" && <span aria-live="assertive">GRACE {graceRemaining}s</span>}
                  {gameState === "playing" && <span>{timeRemaining}s</span>}
                  {gameState === "won" && <span style={{ color: "#15803d" }}>pts</span>}
                  {gameState === "lost" && "—"}
                </p>
              </div>
            </div>

            {/* Session stats bar */}
            {sessionScore.played > 0 && (
              <div className="flex gap-4 mb-2 text-[10px] text-[#8b8b8b]">
                <span>Session: <strong className="text-[#4a4a4a]">{sessionScore.total.toLocaleString()} pts</strong></span>
                <span><strong className="text-[#4a4a4a]">{sessionScore.won}/{sessionScore.played}</strong> won</span>
              </div>
            )}

            {/* Timer bar */}
            <div
              className="w-full h-[3px] bg-[#eae7e0] rounded-full overflow-hidden mb-3"
              role="progressbar"
              aria-valuenow={Math.round(timerPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={
                gameState === "preview" ? "Get ready"
                : gameState === "grace" ? `Grace period: ${graceRemaining} seconds`
                : `Time remaining: ${timeRemaining} seconds`
              }
            >
              <div
                className="h-full rounded-full transition-all duration-1000 linear"
                style={{
                  width: `${isFinished ? 0 : timerPercent}%`,
                  backgroundColor: gameState === "preview" ? "#b45309" : isUrgent ? "#b91c1c" : "#b45309",
                }}
              />
            </div>

            {/* Guess input — only during active play, not preview */}
            {isActive && (
              <div className={wrongFlash ? "animate-shake" : ""} role="form" aria-label="Guess the artist">
                <div
                  className={`
                    flex items-center rounded-lg border-2 transition-all duration-200
                    ${wrongFlash
                      ? "border-[#b91c1c] bg-[#fef2f2]"
                      : "border-[#d5d0c7] bg-white focus-within:border-[#b45309]"}
                  `}
                >
                  <label htmlFor="guess-input" className="sr-only">Your guess</label>
                  <input
                    id="guess-input"
                    ref={inputRef}
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Who is it?"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="flex-1 bg-transparent text-[15px] text-[#1a1a1a] px-4 py-3 outline-none placeholder:text-[#b0ab9f]"
                  />
                  <button
                    onClick={handleGuess}
                    disabled={!guess.trim()}
                    aria-label="Submit guess"
                    className="px-5 py-3 text-base font-semibold transition-all rounded-r-md
                      text-[#b45309] hover:text-[#a14a08]
                      disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
                {guessHistory.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 px-1" role="status" aria-label="Wrong guesses">
                    {guessHistory.map((g, i) => (
                      <span
                        key={i}
                        className="text-[11px] text-[#b91c1c] px-2 py-0.5 rounded bg-[#fef2f2] line-through animate-fade-up"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Result */}
            {isFinished && (
              <div className="flex items-center justify-between animate-fade-up" role="status" aria-live="polite">
                <div>
                  {gameState === "won" ? (
                    <>
                      <p className="font-display text-2xl text-[#15803d]">{puzzle.answer}</p>
                      <p className="text-[12px] text-[#6b6b6b] mt-0.5">Guessed on clue {songsUsed} of {puzzle.totalSongs}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[12px] text-[#6b6b6b]">The answer was</p>
                      <p className="font-display text-2xl text-[#b91c1c]">{puzzle.answer}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="text-xs px-4 py-2 rounded-lg border border-[#d5d0c7] text-[#4a4a4a]
                      hover:border-[#b0ab9f] hover:text-[#1a1a1a] active:scale-95 transition-all"
                  >
                    {copied ? "Copied!" : "Share"}
                  </button>
                  <button
                    onClick={loadNextPuzzle}
                    className="text-xs px-4 py-2 rounded-lg bg-[#b45309] text-white font-semibold
                      hover:bg-[#a14a08] active:scale-95 transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Song list */}
        <main className="flex-1 overflow-y-auto hide-scrollbar" ref={songListRef}>
          <div className="max-w-lg mx-auto px-4 py-3">
            {/* Dot progress */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <p className="text-[10px] tracking-[3px] text-[#8b8b8b] uppercase" aria-hidden="true">Clues</p>
              <div className="flex gap-[3px]" role="img" aria-label={`${revealedCount} of ${puzzle.totalSongs} clues revealed`}>
                {puzzle.songs.map((_, i) => (
                  <div
                    key={i}
                    className="w-[6px] h-[6px] rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor:
                        i < revealedCount
                          ? gameState === "won" && i === songsUsed - 1 ? "#15803d" : "#b45309"
                          : "#e0ddd6",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Songs — newest clue at top */}
            <ol className="space-y-1 list-none" aria-label="Song clues">
              {Array.from({ length: revealedCount }, (_, i) => revealedCount - 1 - i).map((idx) => {
                const song = puzzle.songs[idx];
                const justRevealed = idx === revealedCount - 1 && (isActive || gameState === "preview");
                const wasWinningSong = gameState === "won" && idx === songsUsed - 1;

                return (
                  <li
                    key={idx}
                    data-song
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300
                      bg-white shadow-sm animate-slide-reveal
                      ${justRevealed ? "ring-1 ring-[#b45309]/25" : ""}
                      ${wasWinningSong ? "ring-1 ring-[#15803d]/30 bg-[#f0fdf4]" : ""}
                    `}
                    aria-label={`Clue ${idx + 1}: ${song.name}`}
                  >
                    <span className="text-[11px] font-mono w-5 text-right shrink-0 tabular-nums text-[#8b8b8b]" aria-hidden="true">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className={`text-[14px] leading-snug ${wasWinningSong ? "text-[#15803d] font-medium" : "text-[#4a4a4a]"}`}>
                      {song.name}
                    </p>
                  </li>
                );
              })}
              {puzzle.songs.slice(revealedCount).map((_, i) => {
                const originalIndex = revealedCount + i;
                return (
                  <li
                    key={`unrevealed-${originalIndex}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-40"
                    aria-label={`Clue ${originalIndex + 1}: not yet revealed`}
                  >
                    <span className="text-[11px] font-mono w-5 text-right shrink-0 tabular-nums text-[#d5d0c7]" aria-hidden="true">
                      {String(originalIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="h-[10px] rounded bg-[#eae7e0]" style={{ width: `${35 + ((originalIndex * 17) % 45)}%` }} aria-hidden="true" />
                  </li>
                );
              })}
            </ol>

            <div className="h-8" />
          </div>
        </main>
      </div>
    </>
  );
}
