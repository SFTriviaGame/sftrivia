import { auth } from "@/auth";
import { db } from "@/db";
import { playerPuzzleHistory, playerScores, streaks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { evaluateBadges } from "@/lib/badge-engine";
import { evaluateTitles } from "@/lib/title-engine";

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
      guessedAtClue,
      gaveUp,
      gracePeriodSave,
    } = body;
    if (!puzzleId || score === undefined || !mode) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Save to player_puzzle_history (now includes title-engine columns)
    await db
      .insert(playerPuzzleHistory)
      .values({
        playerId,
        puzzleId,
        score: won ? score : 0,
        mode,
        genre: genre || null,
        solved: !!won,
        wrongGuesses: wrongGuesses || 0,
        guessedAtClue: won ? (guessedAtClue ?? null) : null,
        gaveUp: !!gaveUp,
        gracePeriodSave: !!gracePeriodSave,
      })
      .onConflictDoNothing();

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
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
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
      const newWinCurrent = won ? (existing.currentStreak || 0) + 1 : 0;
      const newWinLongest = Math.max(
        existing.longestStreak || 0,
        newWinCurrent
      );
      const lastPlayed = existing.lastPlayedDate;
      let newDayCurrent = existing.currentDayStreak || 0;
      if (lastPlayed === today) {
        // Already played today — day streak unchanged
      } else if (lastPlayed === yesterday) {
        newDayCurrent = newDayCurrent + 1;
      } else {
        newDayCurrent = 1;
      }
      const newDayLongest = Math.max(
        existing.longestDayStreak || 0,
        newDayCurrent
      );
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

    // 4. Evaluate badges
    const newBadges = await evaluateBadges(playerId, {
      puzzleId,
      won: !!won,
      score: won ? score : 0,
      mode,
      genre: genre || null,
      songsUsed: songsUsed || 0,
      wrongGuesses: wrongGuesses || 0,
      totalSongs: totalSongs || 0,
      gracePeriodSave: !!gracePeriodSave,
    });

    // 5. Evaluate titles (runs after badges)
    let newTitles: string[] = [];
    let displayedTitle: string | null = null;
    try {
      const titleResult = await evaluateTitles(playerId, puzzleId);
      newTitles = titleResult.newTitles;
      displayedTitle = titleResult.displayedTitle;
    } catch (err) {
      console.error("Title evaluation error:", err);
    }

    return NextResponse.json({
      saved: true,
      newBadges,
      newTitles,
      displayedTitle,
    });
  } catch (err) {
    console.error("Score save error:", err);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
