import { db } from "@/db";
import {
  badges,
  playerBadges,
  playerScores,
  playerPuzzleHistory,
  streaks,
  puzzles,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface PuzzleResult {
  puzzleId: string;
  won: boolean;
  score: number;
  mode: string;
  genre: string | null;
  songsUsed: number;
  wrongGuesses: number;
  totalSongs: number;
  gracePeriodSave: boolean;
}

export async function evaluateBadges(
  playerId: string,
  result: PuzzleResult
): Promise<string[]> {
  const allBadges = await db.select().from(badges).where(eq(badges.isActive, true));
  const earned = await db
    .select({ badgeId: playerBadges.badgeId })
    .from(playerBadges)
    .where(eq(playerBadges.playerId, playerId));

  const earnedIds = new Set(earned.map((e) => e.badgeId));
  const badgeMap = new Map(allBadges.map((b) => [b.triggerEvent, b]));

  const newlyEarned: string[] = [];

  function grant(triggerEvent: string) {
    const badge = badgeMap.get(triggerEvent);
    if (badge && !earnedIds.has(badge.id)) {
      newlyEarned.push(badge.id);
      earnedIds.add(badge.id);
    }
  }

  // ── One-time moments ────────────────────────────────────────────

  if (result.won) {
    grant("first_win");
  }

  if (result.won && result.mode === "album") {
    grant("first_album_win");
  }

  if (result.won && result.wrongGuesses === 0) {
    grant("first_perfect");
  }

  if (result.won && result.gracePeriodSave) {
    grant("first_grace_win");
  }

  if (result.won && result.songsUsed === 1) {
    grant("first_clue_win");
  }

  if (result.won && result.songsUsed === result.totalSongs) {
    grant("last_clue_win");
  }

  // ── Behavioral quirks ──────────────────────────────────────────

  if (result.won && result.score >= 900) {
    grant("score_900");
  }

  if (result.won && result.score >= 1000) {
    grant("score_1000");
  }

  if (result.won && result.wrongGuesses >= 3) {
    grant("win_after_three_wrong");
  }

  // ── Cumulative — only query DB if badge not yet earned ─────────

  if (!earnedIds.has(badgeMap.get("five_genres")?.id || "")) {
    const [genreCount] = await db
      .select({ count: sql<number>`COUNT(DISTINCT genre)` })
      .from(playerPuzzleHistory)
      .where(eq(playerPuzzleHistory.playerId, playerId));
    if (genreCount && genreCount.count >= 5) grant("five_genres");
  }

  const winBadges = [
    { event: "ten_wins", threshold: 10 },
    { event: "fifty_wins", threshold: 50 },
    { event: "hundred_wins", threshold: 100 },
  ];
  const needsWinCheck = winBadges.some(
    (b) => !earnedIds.has(badgeMap.get(b.event)?.id || "")
  );
  if (needsWinCheck) {
    const [winCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(playerScores)
      .where(and(eq(playerScores.playerId, playerId), eq(playerScores.guessed, true)));
    if (winCount) {
      for (const b of winBadges) {
        if (winCount.count >= b.threshold) grant(b.event);
      }
    }
  }

  const pointBadges = [
    { event: "ten_k_points", threshold: 10000 },
    { event: "fifty_k_points", threshold: 50000 },
  ];
  const needsPointCheck = pointBadges.some(
    (b) => !earnedIds.has(badgeMap.get(b.event)?.id || "")
  );
  if (needsPointCheck) {
    const [totalPoints] = await db
      .select({ total: sql<number>`COALESCE(SUM(score), 0)` })
      .from(playerScores)
      .where(and(eq(playerScores.playerId, playerId), eq(playerScores.guessed, true)));
    if (totalPoints) {
      for (const b of pointBadges) {
        if (totalPoints.total >= b.threshold) grant(b.event);
      }
    }
  }

  const streakBadges = [
    { event: "streak_five", threshold: 5 },
    { event: "streak_ten", threshold: 10 },
    { event: "streak_twenty", threshold: 20 },
  ];
  const needsStreakCheck = streakBadges.some(
    (b) => !earnedIds.has(badgeMap.get(b.event)?.id || "")
  );
  if (needsStreakCheck) {
    const [streakData] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.playerId, playerId))
      .limit(1);
    if (streakData) {
      const best = Math.max(
        streakData.currentStreak || 0,
        streakData.longestStreak || 0
      );
      for (const b of streakBadges) {
        if (best >= b.threshold) grant(b.event);
      }
    }
  }

  if (!earnedIds.has(badgeMap.get("all_genres")?.id || "")) {
    const [availableGenres] = await db
      .select({ count: sql<number>`COUNT(DISTINCT primary_genre)` })
      .from(puzzles)
      .where(eq(puzzles.published, true));
    const [playedGenres] = await db
      .select({ count: sql<number>`COUNT(DISTINCT genre)` })
      .from(playerPuzzleHistory)
      .where(eq(playerPuzzleHistory.playerId, playerId));
    if (
      availableGenres &&
      playedGenres &&
      availableGenres.count > 0 &&
      playedGenres.count >= availableGenres.count
    ) {
      grant("all_genres");
    }
  }

  if (!earnedIds.has(badgeMap.get("dual_threat")?.id || "")) {
    try {
      const dualResult = await db.execute(sql`
        SELECT 1 AS found FROM (
          SELECT p.artist_id
          FROM player_puzzle_history pph
          JOIN puzzles p ON p.id = pph.puzzle_id
          JOIN player_scores ps ON ps.puzzle_id = pph.puzzle_id AND ps.player_id = pph.player_id
          WHERE pph.player_id = ${playerId}
            AND ps.guessed = true
            AND pph.mode = 'artist'
            AND p.artist_id IS NOT NULL
        ) artist_wins
        JOIN (
          SELECT a.artist_id
          FROM player_puzzle_history pph
          JOIN puzzles p ON p.id = pph.puzzle_id
          JOIN albums a ON a.id = p.album_id
          JOIN player_scores ps ON ps.puzzle_id = pph.puzzle_id AND ps.player_id = pph.player_id
          WHERE pph.player_id = ${playerId}
            AND ps.guessed = true
            AND pph.mode = 'album'
            AND p.album_id IS NOT NULL
        ) album_wins
        ON artist_wins.artist_id = album_wins.artist_id
        LIMIT 1
      `);
      if (Array.isArray(dualResult) && dualResult.length > 0) {
        grant("dual_threat");
      } else if (dualResult && typeof dualResult === "object" && "rows" in dualResult) {
        const rows = (dualResult as { rows: unknown[] }).rows;
        if (rows.length > 0) grant("dual_threat");
      }
    } catch {
      // Skip dual threat check if query fails
    }
  }

  // ── Insert newly earned badges ─────────────────────────────────

  for (const badgeId of newlyEarned) {
    await db.insert(playerBadges).values({
      playerId,
      badgeId,
      puzzleId: result.puzzleId,
    }).onConflictDoNothing();
  }

  const earnedNames = allBadges
    .filter((b) => newlyEarned.includes(b.id))
    .map((b) => b.name);

  return earnedNames;
}
