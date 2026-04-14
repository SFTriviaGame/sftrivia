"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthButton } from "@/components/auth-buttons";

// ── Types ───────────────────────────────────────────────────────────────────

interface PuzzleSong {
  order: number;
  name: string;
}

interface PuzzleData {
  id: string;
  artistId: string;
  albumId: string;
  mode: string;
  genre: string;
  tags: string[];
  songs: PuzzleSong[];
  totalSongs: number;
  availableTags: string[];
}

type GameState = "loading" | "ready" | "preview" | "playing" | "grace" | "won" | "lost" | "exhausted";
type GameMode = "artist" | "album";

// ── Constants ───────────────────────────────────────────────────────────────

const TIMER_SECONDS = 30;
const GRACE_SECONDS = 6;
const REVEAL_INTERVAL = 3;
const PREVIEW_SECONDS = 3;
const SCORE_MAX = 1000;
const SCORE_FLOOR = 50;
const WRONG_PENALTY = 50;
const DECAY_PER_SECOND = (SCORE_MAX - SCORE_FLOOR) / TIMER_SECONDS;

// ── Tag display config ──────────────────────────────────────────────────────

const TAG_LABELS: Record<string, string> = {
  "all": "All",
  "60s": "60s",
  "70s": "70s",
  "80s": "80s",
  "90s": "90s",
  "2000s": "2000s",
  "2010s": "2010s",
  "pop": "Pop",
  "classic-rock": "Classic Rock",
  "hair-metal": "Hair Metal",
};

const TAG_ORDER = ["all", "60s", "70s", "80s", "90s", "2000s", "2010s", "pop", "classic-rock", "hair-metal"];

// ── Styles ──────────────────────────────────────────────────────────────────

const injectedStyles = `
  .font-display { font-family: var(--font-display), Georgia, serif; }
  .font-body { font-family: var(--font-body), system-ui, sans-serif; }

  @keyframes slideReveal {
    0% { opacity: 0; transform: translateX(-12px) scale(0.98); }
    60% { opacity: 1; transform: translateX(2px) scale(1.005); }
    100% { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shakeX {
    0%, 100% { transform: translateX(0); }
    15% { transform: translateX(-6px); }
    30% { transform: translateX(6px); }
    45% { transform: translateX(-4px); }
    60% { transform: translateX(4px); }
    75% { transform: translateX(-2px); }
    90% { transform: translateX(2px); }
  }
  @keyframes scorePop {
    0% { transform: scale(1); opacity: 0.7; }
    40% { transform: scale(1.18); opacity: 1; }
    70% { transform: scale(0.96); }
    100% { transform: scale(1); }
  }
  @keyframes dotPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.6); opacity: 0.7; }
  }
  @keyframes resultReveal {
    0% { opacity: 0; transform: translateY(12px) scale(0.95); }
    50% { opacity: 1; transform: translateY(-2px) scale(1.01); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes timerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .animate-slide-reveal { animation: slideReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .animate-fade-up { animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .animate-fade-in { animation: fadeIn 0.3s ease-out both; }
  .animate-shake { animation: shakeX 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
  .animate-score-pop { animation: scorePop 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
  .animate-dot-pulse { animation: dotPulse 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
  .animate-result-reveal { animation: resultReveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .animate-timer-pulse { animation: timerPulse 1s ease-in-out infinite; }

  @media (prefers-reduced-motion: reduce) {
    .animate-slide-reveal, .animate-fade-up, .animate-fade-in, .animate-shake,
    .animate-score-pop, .animate-dot-pulse, .animate-result-reveal,
    .animate-timer-pulse {
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

function getStoredScore(): { total: number; played: number; won: number; streak: number } {
  if (typeof window === "undefined") return { total: 0, played: 0, won: 0, streak: 0 };
  try {
    const raw = localStorage.getItem("deepcut_score");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { total: 0, played: 0, won: 0, streak: 0 };
}

function saveScore(total: number, played: number, won: number, streak: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("deepcut_score", JSON.stringify({ total, played, won, streak }));
  } catch {}
}

// ── Component ───────────────────────────────────────────────────────────────

function PlayPageInner() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag") || "all";
  const initialMode = (searchParams.get("mode") === "album" ? "album" : "artist") as GameMode;

  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode);

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
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sessionScore, setSessionScore] = useState({ total: 0, played: 0, won: 0, streak: 0 });
  const [revealedAnswer, setRevealedAnswer] = useState("");
  const [revealedArtist, setRevealedArtist] = useState("");
  const [validating, setValidating] = useState(false);
  const [playedSubjectIds, setPlayedSubjectIds] = useState<string[]>([]);
  const [latestDotIndex, setLatestDotIndex] = useState(-1);
  const [wasGraceSave, setWasGraceSave] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const revealRef = useRef<NodeJS.Timeout | null>(null);
  const songListRef = useRef<HTMLDivElement>(null);

  // ── Load stored score on mount ──────────────────────────────────────────

  useEffect(() => {
    setSessionScore(getStoredScore());
  }, []);

  // ── Fetch puzzle ────────────────────────────────────────────────────────

  const fetchPuzzle = useCallback((tag: string, mode: GameMode, excludeIds: string[] = []) => {
    const params = new URLSearchParams({ t: String(Date.now()), mode });
    if (tag && tag !== "all") params.set("tag", tag);
    if (excludeIds.length > 0) params.set("exclude", excludeIds.join(","));

    return fetch(`/api/puzzle?${params.toString()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
    })
      .then((r) => {
        if (r.status === 404) throw new Error("exhausted");
        return r.json();
      })
      .then((data: PuzzleData) => {
        setPuzzle(data);
        if (data.availableTags) setAvailableTags(data.availableTags);
        const subjectId = mode === "album" ? data.albumId : data.artistId;
        if (subjectId) {
          setPlayedSubjectIds((prev) => [...prev, subjectId]);
        }
        return data;
      });
  }, []);

  // ── Server-side validation helpers ──────────────────────────────────────

  const validateGuess = useCallback(
    async (puzzleId: string, guessText: string): Promise<{ correct: boolean; answer?: string; artist?: string }> => {
      const res = await fetch("/api/puzzle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, guess: guessText, action: "guess" }),
      });
      return res.json();
    },
    []
  );

  const fetchAnswer = useCallback(async (puzzleId: string): Promise<{ answer: string; artist?: string }> => {
    const res = await fetch("/api/puzzle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId, action: "reveal" }),
    });
    const data = await res.json();
    return { answer: data.answer || "Unknown", artist: data.artist };
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPuzzle(initialTag, initialMode)
      .then(() => setGameState("ready"))
      .catch((err) => {
        if (err.message === "exhausted") setGameState("exhausted");
        else console.error(err);
      });
  }, [fetchPuzzle]);

  // ── Start game (goes through preview) ───────────────────────────────────

  const startGame = () => {
    setRevealedCount(1);
    setLatestDotIndex(0);
    setGameState("preview");
  };

  // ── Preview timer ───────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState !== "preview") return;
    const t = setTimeout(() => setGameState("playing"), PREVIEW_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [gameState]);

  // ── Load next puzzle ────────────────────────────────────────────────────

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
    setRevealedAnswer("");
    setRevealedArtist("");
    setValidating(false);
    setLatestDotIndex(-1);
    setWasGraceSave(false);
    setNewBadges([]);
    fetchPuzzle(selectedTag, selectedMode, playedSubjectIds)
      .then(() => {
        setRevealedCount(1);
        setLatestDotIndex(0);
        setGameState("preview");
      })
      .catch((err) => {
        if (err.message === "exhausted") {
          setGameState("exhausted");
        } else {
          console.error(err);
        }
      });
  };

  // ── Change category ─────────────────────────────────────────────────────

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
    setRevealedAnswer("");
    setRevealedArtist("");
    setValidating(false);
    setLatestDotIndex(-1);
    setPlayedSubjectIds([]);
    fetchPuzzle(tag, selectedMode)
      .then(() => setGameState("ready"))
      .catch((err) => {
        if (err.message === "exhausted") setGameState("exhausted");
        else console.error(err);
      });
  };

  // ── Change mode ─────────────────────────────────────────────────────────

  const changeMode = (mode: GameMode) => {
    if (mode === selectedMode) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (revealRef.current) clearInterval(revealRef.current);
    setSelectedMode(mode);
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
    setRevealedAnswer("");
    setRevealedArtist("");
    setValidating(false);
    setLatestDotIndex(-1);
    setPlayedSubjectIds([]);
    fetchPuzzle(selectedTag, mode)
      .then(() => setGameState("ready"))
      .catch((err) => {
        if (err.message === "exhausted") setGameState("exhausted");
        else console.error(err);
      });
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
        const next = prev + 1;
        setLatestDotIndex(next - 1);
        return next;
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

  // ── Reveal answer on loss ───────────────────────────────────────────────

  useEffect(() => {
    if (gameState === "lost" && puzzle && !revealedAnswer) {
      fetchAnswer(puzzle.id).then((result) => {
        setRevealedAnswer(result.answer);
        if (result.artist) setRevealedArtist(result.artist);
      });
    }
  }, [gameState, puzzle, revealedAnswer, fetchAnswer]);

  // ── Track score on game end ─────────────────────────────────────────────

  useEffect(() => {
    if (gameState === "won" || gameState === "lost") {
      const prev = getStoredScore();
      const updated = {
        total: prev.total + (gameState === "won" ? finalScore : 0),
        played: prev.played + 1,
        won: prev.won + (gameState === "won" ? 1 : 0),
        streak: gameState === "won" ? prev.streak + 1 : 0,
      };
      saveScore(updated.total, updated.played, updated.won, updated.streak);
      setSessionScore(updated);

      // Save to database if authenticated
      if (puzzle) {
        fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            puzzleId: puzzle.id,
            score: gameState === "won" ? finalScore : 0,
            mode: selectedMode,
            genre: puzzle.genre || puzzle.tags?.[0] || null,
            won: gameState === "won",
            songsUsed: songsUsed,
            wrongGuesses: wrongGuesses,
            totalSongs: puzzle.totalSongs,
            gracePeriodSave: wasGraceSave,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.newBadges && data.newBadges.length > 0) {
              setNewBadges(data.newBadges);
            }
          })
          .catch(() => {});
      }
    }
  }, [gameState, finalScore]);

  // ── Focus input when guessing is possible ───────────────────────────────

  useEffect(() => {
    if (gameState === "preview" || gameState === "playing" || gameState === "grace") {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [gameState]);

  // ── Refocus after validation completes (iOS fallback) ───────────────────

  useEffect(() => {
    if (!validating && (gameState === "preview" || gameState === "playing" || gameState === "grace")) {
      inputRef.current?.focus();
    }
  }, [validating, gameState]);

  // ── Guess (server-validated) ────────────────────────────────────────────

  const canGuess = gameState === "preview" || gameState === "playing" || gameState === "grace";

  const handleGuess = useCallback(async () => {
    if (!puzzle || !guess.trim() || validating) return;
    if (!canGuess) return;
    const trimmed = guess.trim();

    setValidating(true);
    try {
      const result = await validateGuess(puzzle.id, trimmed);

      if (result.correct) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (revealRef.current) clearInterval(revealRef.current);
        const earned = gameState === "grace" ? SCORE_FLOOR : score;
        setWasGraceSave(gameState === "grace");
        setFinalScore(earned);
        setSongsUsed(revealedCount);
        setRevealedCount(puzzle.totalSongs);
        setRevealedAnswer(result.answer || "");
        if (result.artist) setRevealedArtist(result.artist);
        setGameState("won");
        setScorePop(true);
        setTimeout(() => setScorePop(false), 500);
      } else {
        setGuessHistory((prev) => [...prev, trimmed]);
        setWrongGuesses((prev) => prev + 1);
        setGuess("");
        setWrongFlash(true);
        inputRef.current?.focus();
        setTimeout(() => setWrongFlash(false), 500);
      }
    } catch {
      console.error("Validation request failed");
    } finally {
      setValidating(false);
    }
  }, [puzzle, guess, gameState, score, revealedCount, validating, validateGuess, canGuess]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGuess();
  };

  const giveUp = () => {
    if (!puzzle) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (revealRef.current) clearInterval(revealRef.current);
    setFinalScore(0);
    setSongsUsed(revealedCount);
    setRevealedCount(puzzle.totalSongs);
    setGameState("lost");
  };

  // ── Share ───────────────────────────────────────────────────────────────

  const handleShare = () => {
    if (!puzzle) return;
    const blocks = puzzle.songs.map((_, i) => {
      if (gameState === "won" && i < songsUsed) return i === songsUsed - 1 ? "🟩" : "⬛";
      if (gameState === "lost") return "⬛";
      return "⬜";
    });
    const modeLabel = selectedMode === "album" ? " — Album" : "";
    const text = [`🎵 Deep Cut${modeLabel}`, blocks.join(""),
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

  const displayTags = ["all", ...availableTags].sort((a, b) => {
    const ai = TAG_ORDER.indexOf(a);
    const bi = TAG_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const modeSubtitle = selectedMode === "album" ? "Name the Album" : "Name the Artist";
  const inputPlaceholder = selectedMode === "album" ? "What album?" : "Who is it?";

  // ── Exhausted — no more puzzles in this category ─────────────────────

  if (gameState === "exhausted") {
    const otherTags = displayTags.filter((t) => t !== selectedTag);

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
        <main id="main-content" className="fixed inset-0 bg-[#FAFAF8] flex flex-col items-center justify-center px-6 overflow-y-auto">
          <div className="animate-fade-up text-center max-w-sm w-full">
            <p className="font-body text-[10px] tracking-[5px] text-[#737373] uppercase mb-2">
              🎉 Nice work
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-[#1a1a1a] mb-2 leading-tight">
              You played them all
            </h1>
            <p className="font-body text-sm text-[#6b6b6b] mb-8">
              {selectedTag === "all"
                ? `Every ${selectedMode} in the catalog. Impressive.`
                : `No more ${TAG_LABELS[selectedTag] || selectedTag} ${selectedMode} puzzles left this session.`}
            </p>

            {sessionScore.played > 0 && (
              <div className="flex justify-center gap-5 mb-8 font-body text-xs text-[#737373]">
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums leading-tight">{sessionScore.total.toLocaleString()}</p>
                  <p className="text-[10px]">total pts</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums leading-tight">{sessionScore.won}/{sessionScore.played}</p>
                  <p className="text-[10px]">won</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums leading-tight">
                    {Math.round(sessionScore.total / sessionScore.played)}
                  </p>
                  <p className="text-[10px]">avg</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums leading-tight">{sessionScore.streak}</p>
                  <p className="text-[10px]">streak</p>
                </div>
              </div>
            )}

            {selectedTag !== "all" && (
              <div className="mb-6">
                <p className="font-body text-[10px] tracking-[3px] text-[#737373] uppercase mb-2.5">Try another category</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {otherTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => changeCategory(tag)}
                      className="font-body text-xs px-3 py-1.5 rounded-full border transition-all duration-200
                        bg-transparent text-[#4a4a4a] border-[#d5d0c7] hover:border-[#b45309] hover:text-[#b45309] active:scale-95"
                    >
                      {TAG_LABELS[tag] || tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => changeCategory("all")}
              className="font-body w-full py-3 rounded-lg text-sm font-semibold tracking-wide uppercase
                bg-[#b45309] text-white hover:bg-[#a14a08]
                active:scale-[0.97] transition-all duration-150 shadow-sm"
            >
              {selectedTag === "all" ? "Start Fresh" : "Play All Categories"}
            </button>

            <nav className="mt-8 font-body text-[11px] text-[#737373]" aria-label="Navigation">
  <AuthButton />
  <span className="mx-2" aria-hidden="true">·</span>
              <a href="/leaderboard" className="hover:text-[#b45309] transition-colors">Leaderboard</a>
  <span className="mx-2" aria-hidden="true">·</span>
              <a href="/genres" className="hover:text-[#b45309] transition-colors">Genres</a>
              <span className="mx-2" aria-hidden="true">·</span>
              <a href="/profile" className="hover:text-[#b45309] transition-colors">Profile</a>
              <span className="mx-2" aria-hidden="true">·</span>
              <a href="/privacy" className="hover:text-[#b45309] transition-colors">Privacy</a>
              <span className="mx-2" aria-hidden="true">·</span>
              <a href="/terms" className="hover:text-[#b45309] transition-colors">Terms</a>
              <span className="mx-2" aria-hidden="true">·</span>
              <a href="/about" className="hover:text-[#b45309] transition-colors">How to Play</a>
            </nav>
          </div>
        </main>
      </>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────

  if (gameState === "loading" || !puzzle) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
        <main id="main-content" className="fixed inset-0 bg-[#FAFAF8] flex items-center justify-center" role="status">
          <div className="animate-fade-up text-center">
            <p className="font-display text-2xl text-[#1a1a1a] mb-1">Deep Cut</p>
            <p className="font-body text-[#737373] text-xs tracking-widest uppercase">Loading...</p>
          </div>
        </main>
      </>
    );
  }

  // ── Start screen ────────────────────────────────────────────────────────

  if (gameState === "ready") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
        <main id="main-content" className="fixed inset-0 bg-[#FAFAF8] flex flex-col items-center justify-center px-6 overflow-y-auto">
          <div className="animate-fade-up text-center max-w-sm w-full">
            <p className="font-body text-[10px] tracking-[5px] text-[#737373] uppercase mb-2">
              Daily Puzzle
            </p>
            <h1 className="font-display text-5xl sm:text-6xl text-[#1a1a1a] mb-1 leading-[1.05]">
              Deep Cut
            </h1>
            <p className="font-display text-lg text-[#737373] italic mb-5">
              {modeSubtitle}
            </p>

            {/* Mode toggle */}
            <div className="flex justify-center gap-1 mb-7 bg-[#eae7e0] rounded-lg p-1" role="group" aria-label="Game mode">
              <button
                onClick={() => changeMode("artist")}
                aria-pressed={selectedMode === "artist"}
                className={`font-body text-xs px-4 py-1.5 rounded-md transition-all duration-200 ${
                  selectedMode === "artist"
                    ? "bg-white text-[#1a1a1a] shadow-sm font-medium"
                    : "bg-transparent text-[#737373] hover:text-[#4a4a4a]"
                }`}
              >
                Artist
              </button>
              <button
                onClick={() => changeMode("album")}
                aria-pressed={selectedMode === "album"}
                className={`font-body text-xs px-4 py-1.5 rounded-md transition-all duration-200 ${
                  selectedMode === "album"
                    ? "bg-white text-[#1a1a1a] shadow-sm font-medium"
                    : "bg-transparent text-[#737373] hover:text-[#4a4a4a]"
                }`}
              >
                Album
              </button>
            </div>

            {sessionScore.played > 0 && (
              <div className="flex justify-center gap-5 mb-7 font-body text-xs text-[#737373]">
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums leading-tight">{sessionScore.total.toLocaleString()}</p>
                  <p className="text-[10px]">total pts</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums leading-tight">{sessionScore.won}/{sessionScore.played}</p>
                  <p className="text-[10px]">won</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums leading-tight">
                    {sessionScore.played > 0 ? Math.round(sessionScore.total / sessionScore.played) : 0}
                  </p>
                  <p className="text-[10px]">avg</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a] tabular-nums leading-tight">{sessionScore.streak}</p>
                  <p className="text-[10px]">streak</p>
                </div>
              </div>
            )}

            <div className="mb-7">
              <p className="font-body text-[10px] tracking-[3px] text-[#737373] uppercase mb-2.5" id="category-label">Category</p>
              <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-labelledby="category-label">
                {displayTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (tag !== selectedTag) changeCategory(tag);
                    }}
                    aria-pressed={tag === selectedTag}
                    className={`
                      font-body text-xs px-3 py-1.5 rounded-full border transition-all duration-200
                      ${tag === selectedTag
                        ? "bg-[#b45309] text-white border-[#b45309] shadow-sm"
                        : "bg-transparent text-[#4a4a4a] border-[#d5d0c7] hover:border-[#b45309] hover:text-[#b45309] active:scale-95"
                      }
                    `}
                  >
                    {TAG_LABELS[tag] || tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 mb-7 text-left">
              <div className="flex items-start gap-3">
                <span className="font-body text-[10px] text-[#b45309] font-semibold mt-0.5 w-4 text-right shrink-0 tabular-nums">01</span>
                <p className="font-body text-[13px] text-[#4a4a4a] leading-snug">Songs reveal one at a time — deep cuts first, hits last</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-body text-[10px] text-[#b45309] font-semibold mt-0.5 w-4 text-right shrink-0 tabular-nums">02</span>
                <p className="font-body text-[13px] text-[#4a4a4a] leading-snug">
                  Type your guess whenever you think you know the {selectedMode}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-body text-[10px] text-[#b45309] font-semibold mt-0.5 w-4 text-right shrink-0 tabular-nums">03</span>
                <p className="font-body text-[13px] text-[#4a4a4a] leading-snug">The earlier you guess, the higher your score</p>
              </div>
            </div>

            <button
              onClick={startGame}
              className="font-body w-full py-3 rounded-lg text-sm font-semibold tracking-wide uppercase
                bg-[#b45309] text-white hover:bg-[#a14a08]
                active:scale-[0.97] transition-all duration-150 shadow-sm"
            >
              Play
            </button>

            <p className="font-body text-[11px] text-[#737373] mt-3">
              {puzzle.totalSongs} clues · {TIMER_SECONDS}s
            </p>

            <nav className="mt-8 font-body text-[11px] text-[#737373]" aria-label="Navigation">
  <AuthButton />
  <span className="mx-2" aria-hidden="true">·</span>
              <a href="/leaderboard" className="hover:text-[#b45309] transition-colors">Leaderboard</a>
              <span className="mx-2" aria-hidden="true">·</span>
              <a href="/genres" className="hover:text-[#b45309] transition-colors">Genres</a>
              <span className="mx-2" aria-hidden="true">·</span>
              <a href="/profile" className="hover:text-[#b45309] transition-colors">Profile</a>
              <span className="mx-2" aria-hidden="true">·</span>
              <a href="/privacy" className="hover:text-[#b45309] transition-colors">Privacy</a>
              <span className="mx-2" aria-hidden="true">·</span>
              <a href="/terms" className="hover:text-[#b45309] transition-colors">Terms</a>
              <span className="mx-2" aria-hidden="true">·</span>
              <a href="/about" className="hover:text-[#b45309] transition-colors">How to Play</a>
            </nav>
          </div>
        </main>
      </>
    );
  }

  // ── Game (preview + playing + grace + results) ──────────────────────────

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />
      <div className="fixed inset-0 bg-[#FAFAF8] text-[#1a1a1a] flex flex-col font-body overflow-hidden animate-fade-in">

        {/* ── Compact sticky header ─────────────────────────────────────── */}
        <header className="shrink-0 z-10 bg-[#FAFAF8] border-b border-[#e8e5de]">
          <div className="max-w-lg mx-auto px-4 pt-2 pb-2">

            {/* Row 1: ← Menu + mode/category ... score/time */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeCategory(selectedTag)}
                  className="text-[10px] text-[#737373] hover:text-[#4a4a4a] transition-colors"
                  aria-label="Back to menu"
                >
                  <span aria-hidden="true">← </span>Menu
                </button>
                {canGuess && (
                  <>
                    <span className="text-[10px] text-[#a09a90]" aria-hidden="true">·</span>
                    <button
                      onClick={giveUp}
                      className="text-[10px] text-[#737373] hover:text-[#b91c1c] transition-colors"
                      aria-label="Give up on this puzzle"
                    >
                      Give up
                    </button>
                  </>
                )}
                {selectedMode === "album" && (
                  <span className="text-[9px] text-[#b45309] tracking-wide font-medium px-1.5 py-0.5 rounded bg-[#b45309]/[0.06]">
                    Album
                  </span>
                )}
                {selectedTag !== "all" && (
                  <span className="text-[9px] text-[#b45309] tracking-wide font-medium px-1.5 py-0.5 rounded bg-[#b45309]/[0.06]">
                    {TAG_LABELS[selectedTag] || selectedTag}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5" aria-live="polite">
                <p
                  className={`text-2xl font-bold tabular-nums leading-none transition-colors duration-300 ${scorePop ? "animate-score-pop" : ""}`}
                  style={{
                    color: isFinished
                      ? gameState === "won" ? "#15803d" : "#737373"
                      : isUrgent ? "#b91c1c" : "#1a1a1a",
                  }}
                  aria-label={`Score: ${isFinished ? finalScore : score}`}
                >
                  {isFinished ? finalScore : score}
                </p>
                <p className="text-[10px] leading-none" style={{ color: isUrgent && (isActive || gameState === "preview") ? "#b91c1c" : "#737373" }}>
                  {gameState === "preview" && <span className="text-[#b45309]">ready</span>}
                  {gameState === "grace" && <span className="animate-timer-pulse">GRACE {graceRemaining}s</span>}
                  {gameState === "playing" && <span>{timeRemaining}s</span>}
                  {gameState === "won" && <span style={{ color: "#15803d" }}>pts</span>}
                  {gameState === "lost" && "—"}
                </p>
              </div>
            </div>

            {/* Row 2: Timer bar */}
            <div
              className="w-full h-[3px] bg-[#eae7e0] rounded-full overflow-hidden mb-2"
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
                  backgroundColor: gameState === "preview" ? "#b45309"
                    : gameState === "grace" ? "#b91c1c"
                    : isUrgent ? "#b91c1c" : "#b45309",
                }}
              />
            </div>

            {/* Row 3: Guess input (during play only) */}
            {canGuess && (
              <form
                onSubmit={handleFormSubmit}
                className={wrongFlash ? "animate-shake" : ""}
                aria-label={`Guess the ${selectedMode}`}
              >
                <div
                  className={`
                    flex items-center rounded-lg border-2 transition-all duration-200
                    ${wrongFlash
                      ? "border-[#b91c1c] bg-[#fef2f2]"
                      : "border-[#d5d0c7] bg-white focus-within:border-[#b45309] focus-within:shadow-sm"}
                  `}
                >
                  <label htmlFor="guess-input" className="sr-only">Your guess</label>
                  <input
                    id="guess-input"
                    ref={inputRef}
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder={inputPlaceholder}
                    enterKeyHint="go"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="flex-1 bg-transparent text-[15px] text-[#1a1a1a] px-3.5 py-2 outline-none placeholder:text-[#8a8580]"
                  />
                  <button
                    type="submit"
                    disabled={!guess.trim() || validating}
                    aria-label="Submit guess"
                    className="px-4 py-2 text-base font-semibold transition-all rounded-r-md
                      text-[#b45309] hover:text-[#a14a08]
                      disabled:opacity-20 disabled:cursor-not-allowed active:scale-90"
                  >
                    →
                  </button>
                </div>
                {guessHistory.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 px-0.5" role="status" aria-label="Wrong guesses">
                    {guessHistory.map((g, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-[#b91c1c] px-1.5 py-0.5 rounded bg-[#fef2f2] line-through animate-fade-up"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </form>
            )}
          </div>
        </header>

        {/* ── Song list ─────────────────────────────────────────────────── */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto hide-scrollbar"
          ref={songListRef}
        >
          <div className="max-w-lg mx-auto px-4 py-2.5">

            {/* Answer card — appears at top of list on result */}
            {isFinished && (
              <div
                className={`
                  animate-result-reveal mb-3 px-4 py-3 rounded-xl
                  ${gameState === "won"
                    ? "bg-[#f0fdf4] ring-1 ring-[#15803d]/20"
                    : "bg-[#fef2f2] ring-1 ring-[#b91c1c]/15"
                  }
                `}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center justify-between">
                  <div>
                    {gameState === "won" ? (
                      <>
                        <p className="font-display text-2xl text-[#15803d] leading-tight">{revealedAnswer}</p>
                        {revealedArtist && (
                          <p className="font-display text-sm text-[#15803d]/70 leading-tight mt-0.5">{revealedArtist}</p>
                        )}
                        <p className="text-[11px] text-[#6b6b6b] mt-1">
                          Guessed on clue {songsUsed} of {puzzle.totalSongs} · {finalScore} pts
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] text-[#6b6b6b]">The answer was</p>
                        <p className="font-display text-2xl text-[#b91c1c] leading-tight">{revealedAnswer || "..."}</p>
                        {revealedArtist && (
                          <p className="font-display text-sm text-[#b91c1c]/70 leading-tight mt-0.5">{revealedArtist}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dot progress */}
            <div className="flex items-center gap-2 mb-2.5 px-0.5">
              <p className="text-[9px] tracking-[3px] text-[#737373] uppercase" aria-hidden="true">Clues</p>
              <div className="flex gap-[3px]" role="img" aria-label={`${revealedCount} of ${puzzle.totalSongs} clues revealed`}>
                {puzzle.songs.map((_, i) => {
                  const isRevealed = i < revealedCount;
                  const isWinDot = gameState === "won" && i === songsUsed - 1;
                  const justAppeared = i === latestDotIndex && canGuess;

                  return (
                    <div
                      key={i}
                      className={`w-[6px] h-[6px] rounded-full transition-colors duration-300 ${justAppeared ? "animate-dot-pulse" : ""}`}
                      style={{
                        backgroundColor: isRevealed
                          ? isWinDot ? "#15803d" : "#b45309"
                          : "#e0ddd6",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Songs — newest clue at top */}
            <ol className="space-y-1 list-none" aria-label="Song clues">
              {Array.from({ length: revealedCount }, (_, i) => revealedCount - 1 - i).map((idx) => {
                const song = puzzle.songs[idx];
                const justRevealed = idx === revealedCount - 1 && canGuess;
                const wasWinningSong = gameState === "won" && idx === songsUsed - 1;
                const isOlder = idx < revealedCount - 1 && !isFinished;

                return (
                  <li
                    key={idx}
                    data-song
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300
                      animate-slide-reveal
                      ${justRevealed
                        ? "bg-white shadow-sm ring-1 ring-[#b45309]/20"
                        : wasWinningSong
                          ? "bg-[#f0fdf4] shadow-sm ring-1 ring-[#15803d]/25"
                          : isOlder
                            ? "bg-[#FAFAF8]"
                            : "bg-white shadow-sm"
                      }
                    `}
                    style={{ opacity: isOlder ? 0.65 : 1 }}
                    aria-label={`Clue ${idx + 1}: ${song.name}`}
                  >
                    <span
                      className="text-[10px] font-mono w-5 text-right shrink-0 tabular-nums"
                      style={{
                        color: wasWinningSong ? "#15803d"
                          : justRevealed ? "#b45309"
                          : "#8a8580",
                      }}
                      aria-hidden="true"
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className={`text-[14px] leading-snug ${
                      wasWinningSong ? "text-[#15803d] font-medium"
                      : justRevealed ? "text-[#1a1a1a]"
                      : "text-[#4a4a4a]"
                    }`}>
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ opacity: 0.3 }}
                    aria-label={`Clue ${originalIndex + 1}: not yet revealed`}
                  >
                    <span className="text-[10px] font-mono w-5 text-right shrink-0 tabular-nums text-[#d5d0c7]" aria-hidden="true">
                      {String(originalIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="h-[8px] rounded-sm bg-[#e5e2db]" style={{ width: `${30 + ((originalIndex * 19) % 50)}%` }} aria-hidden="true" />
                  </li>
                );
              })}
            </ol>

            {!isFinished && <div className="h-8" />}
          </div>
        </main>

        {/* ── Sticky bottom bar — result actions ────────────────────────── */}
        {newBadges.length > 0 && (
          <div className="shrink-0 z-20 bg-[#faeeda] border-t border-[#e8c97a]">
            <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center gap-2">
              <span className="text-base" aria-hidden="true">🏆</span>
              <p className="font-body text-sm text-[#854f0b] font-medium">
                Badge earned: {newBadges.join(", ")}
              </p>
            </div>
          </div>
        )}
        {isFinished && (
          <div className="shrink-0 z-10 bg-[#FAFAF8] border-t border-[#e8e5de]" style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}>
            <div className="max-w-lg mx-auto px-4 pt-2 pb-0">
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  aria-label={copied ? "Copied to clipboard" : "Share your result"}
                  className="flex-1 text-sm py-2.5 rounded-lg border border-[#d5d0c7] text-[#4a4a4a] font-medium
                    hover:border-[#8a8580] hover:text-[#1a1a1a] active:scale-[0.97] transition-all"
                >
                  {copied ? "Copied!" : "Share"}
                </button>
                <a
                  href="/profile"
                  aria-label="View your profile"
                  className="text-sm py-2.5 px-4 rounded-lg border border-[#d5d0c7] text-[#4a4a4a] font-medium
                    hover:border-[#8a8580] hover:text-[#1a1a1a] active:scale-[0.97] transition-all
                    flex items-center justify-center"
                >
                  Profile
                </a>
                <button
                  onClick={loadNextPuzzle}
                  aria-label="Next puzzle"
                  className="flex-1 text-sm py-2.5 rounded-lg bg-[#b45309] text-white font-semibold
                    hover:bg-[#a14a08] active:scale-[0.97] transition-all shadow-sm"
                >
                  Next <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Suspense wrapper (required for useSearchParams in App Router) ────────

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <main className="fixed inset-0 bg-[#FAFAF8] flex items-center justify-center">
          <div className="text-center">
            <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.5rem", color: "#1a1a1a", marginBottom: "0.25rem" }}>Deep Cut</p>
            <p style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "#737373", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading...</p>
          </div>
        </main>
      }
    >
      <PlayPageInner />
    </Suspense>
  );
}
