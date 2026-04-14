import { auth } from "@/auth";
import { db } from "@/db";
import { playerPuzzleHistory, playerScores, streaks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { evaluateBadges } from "@/lib/badge-engine";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.playerProfileId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const playerId = session.user.playerProfileId;

  try {
    const body = await request.json();
    const {
      puzzleId,
      score,
      mode,
      genre,
      won,
      songsUsed,
      wrongGuesses,
      totalSongs,
    } = body;

    if (!puzzleId || score === undefined || !mode) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Save to player_puzzle_history
    await db
      .insert(playerPuzzleHistory)
      .values({
        playerId,
        puzzleId,
        score: won ? score : 0,
        mode,
        genre: genre || null,
      })
      .onConflictDoNothing(); // Don't double-save if called twice

    // 2. Save to player_scores
    await db.insert(playerScores).values({
      puzzleId,
      playerId,
      score: won ? score : 0,
      songsUsed: songsUsed || 0,
      wrongGuesses: wrongGuesses || 0,
      guessed: won,
    });

    // 3. Update streaks
    // 3. Update streaks
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const [existing] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.playerId, playerId))
      .limit(1);

    if (!existing) {
      await db.insert(streaks).values({
        playerId,
        currentStreak: won ? 1 : 0,
        longestStreak: won ? 1 : 0,
        currentDayStreak: 1,
        longestDayStreak: 1,
        lastPlayedDate: today,
      });
    } else {
      // Win streak — consecutive wins regardless of day
      const newWinCurrent = won ? (existing.currentStreak || 0) + 1 : 0;
      const newWinLongest = Math.max(existing.longestStreak || 0, newWinCurrent);

      // Day streak — consecutive days played
      const lastPlayed = existing.lastPlayedDate;
      let newDayCurrent = existing.currentDayStreak || 0;

      if (lastPlayed === today) {
        // Already played today — day streak unchanged
      } else if (lastPlayed === yesterday) {
        // Consecutive day — increment
        newDayCurrent = newDayCurrent + 1;
      } else {
        // Gap in days — reset to 1 (today counts)
        newDayCurrent = 1;
      }

      const newDayLongest = Math.max(existing.longestDayStreak || 0, newDayCurrent);

      await db
        .update(streaks)
        .set({
          currentStreak: newWinCurrent,
          longestStreak: newWinLongest,
          currentDayStreak: newDayCurrent,
          longestDayStreak: newDayLongest,
          lastPlayedDate: today,
          updatedAt: sql`NOW()`,
        })
        .where(eq(streaks.playerId, playerId));
    }

    // Evaluate badges
    const newBadges = await evaluateBadges(playerId, {
      puzzleId,
      won: !!won,
      score: won ? score : 0,
      mode,
      genre: genre || null,
      songsUsed: songsUsed || 0,
      wrongGuesses: wrongGuesses || 0,
      totalSongs: totalSongs || 0,
      gracePeriodSave: !!body.gracePeriodSave,
    });

    return NextResponse.json({ saved: true, newBadges });
  } catch (err) {
    console.error("Score save error:", err);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
