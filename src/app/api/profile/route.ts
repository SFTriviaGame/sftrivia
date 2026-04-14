import { auth } from "@/auth";
import { db } from "@/db";
import {
  playerPuzzleHistory,
  playerScores,
  streaks,
  puzzles,
  artists,
  albums,
  badges,
  playerBadges,
  titles,
  playerTitles,
} from "@/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.playerProfileId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const playerId = session.user.playerProfileId;

  try {
    // 1. Streaks
    const [streakData] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.playerId, playerId))
      .limit(1);

    // 2. Scores
    const scores = await db
      .select()
      .from(playerScores)
      .where(eq(playerScores.playerId, playerId));

    // 3. Puzzle history with subject details
    const history = await db
      .select({
        score: playerPuzzleHistory.score,
        completedAt: playerPuzzleHistory.completedAt,
        mode: playerPuzzleHistory.mode,
        genre: playerPuzzleHistory.genre,
        puzzleId: playerPuzzleHistory.puzzleId,
        songsUsed: playerScores.songsUsed,
        wrongGuesses: playerScores.wrongGuesses,
        guessed: playerScores.guessed,
        artistName: artists.name,
        albumName: albums.name,
        totalSongs: sql<number>`(
          SELECT COUNT(*) FROM puzzle_songs
          WHERE puzzle_songs.puzzle_id = ${playerPuzzleHistory.puzzleId}
        )`,
      })
      .from(playerPuzzleHistory)
      .leftJoin(
        playerScores,
        and(
          eq(playerScores.puzzleId, playerPuzzleHistory.puzzleId),
          eq(playerScores.playerId, playerPuzzleHistory.playerId)
        )
      )
      .leftJoin(puzzles, eq(puzzles.id, playerPuzzleHistory.puzzleId))
      .leftJoin(artists, eq(artists.id, puzzles.artistId))
      .leftJoin(albums, eq(albums.id, puzzles.albumId))
      .where(eq(playerPuzzleHistory.playerId, playerId))
      .orderBy(desc(playerPuzzleHistory.completedAt));

    // 4. Compute stats
    const totalPlayed = history.length;
    const totalSolved = history.filter((h) => h.guessed).length;
    const winRate = totalPlayed > 0 ? Math.round((totalSolved / totalPlayed) * 100) : 0;
    const wonScores = scores.filter((s) => s.guessed).map((s) => s.score);
    const avgScore = wonScores.length > 0 ? Math.round(wonScores.reduce((a, b) => a + b, 0) / wonScores.length) : 0;
    const bestScore = wonScores.length > 0 ? Math.max(...wonScores) : 0;
    const perfectGames = scores.filter((s) => s.guessed && s.wrongGuesses === 0).length;
    const guessedClues = scores.filter((s) => s.guessed && s.songsUsed > 0).map((s) => s.songsUsed);
    const avgClue = guessedClues.length > 0
      ? Math.round((guessedClues.reduce((a, b) => a + b, 0) / guessedClues.length) * 10) / 10
      : 0;

    // 5. Genre radar
    const genreCounts: Record<string, number> = {};
    for (const h of history) {
      const genre = h.genre || "Unknown";
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    }
    const maxGenreCount = Math.max(...Object.values(genreCounts), 1);
    const genreRadar = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre, value]) => ({
        genre,
        value,
        fullMark: maxGenreCount,
      }));

    // 6. Format history
    const formattedHistory = history.map((h) => ({
      date: h.completedAt
        ? new Date(h.completedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Unknown",
      mode: h.mode === "album" ? "Album" : "Artist",
      subject: h.mode === "album" ? (h.albumName || "Unknown") : (h.artistName || "Unknown"),
      genre: h.genre || "\u2014",
      solved: h.guessed || false,
      score: h.score || 0,
      clue: h.guessed ? h.songsUsed : null,
      totalSongs: h.totalSongs || 9,
      wrong: h.wrongGuesses || 0,
    }));

    // 7. Badges
    const earnedBadges = await db
      .select({
        name: badges.name,
        description: badges.description,
        rarity: badges.rarity,
        displayOrder: badges.displayOrder,
        earnedAt: playerBadges.earnedAt,
      })
      .from(playerBadges)
      .innerJoin(badges, eq(badges.id, playerBadges.badgeId))
      .where(eq(playerBadges.playerId, playerId))
      .orderBy(badges.displayOrder);

    const allBadges = await db
      .select({
        name: badges.name,
        description: badges.description,
        rarity: badges.rarity,
        displayOrder: badges.displayOrder,
      })
      .from(badges)
      .where(eq(badges.isActive, true))
      .orderBy(badges.displayOrder);

    // 8. Titles
    const displayedTitle = await db
      .select({
        name: titles.name,
        titleType: titles.titleType,
        tier: titles.tier,
        level: titles.level,
        genre: titles.genre,
        description: titles.description,
      })
      .from(playerTitles)
      .innerJoin(titles, eq(titles.id, playerTitles.titleId))
      .where(
        and(
          eq(playerTitles.playerId, playerId),
          eq(playerTitles.isDisplayed, true)
        )
      )
      .limit(1)
      .then((rows) => rows[0] || null);

    const allEarnedTitles = await db
      .select({
        name: titles.name,
        titleType: titles.titleType,
        tier: titles.tier,
        level: titles.level,
        genre: titles.genre,
        description: titles.description,
        earnedAt: playerTitles.earnedAt,
        isDisplayed: playerTitles.isDisplayed,
      })
      .from(playerTitles)
      .innerJoin(titles, eq(titles.id, playerTitles.titleId))
      .where(eq(playerTitles.playerId, playerId))
      .orderBy(desc(playerTitles.earnedAt));

    // 9. Build character sheet: genre tracks, depth titles, higher-order titles
    const levelNames = ["Initiate", "Student", "Scholar", "Master", "Legend"];
    const genreMaxLevels: Record<string, { level: number; earnedAt: string | null }> = {};
    const depthTitles: { name: string; titleType: string | null; description: string | null; earnedAt: string | null }[] = [];
    const higherTitles: { name: string; titleType: string | null; description: string | null; earnedAt: string | null; isDisplayed: boolean | null }[] = [];

    for (const t of allEarnedTitles) {
      if (t.titleType === "genre" && t.genre && t.level) {
        const existing = genreMaxLevels[t.genre];
        if (!existing || t.level > existing.level) {
          genreMaxLevels[t.genre] = {
            level: t.level,
            earnedAt: t.earnedAt ? new Date(t.earnedAt).toISOString() : null,
          };
        }
      } else if (t.titleType === "depth_artist" || t.titleType === "depth_album" || t.titleType === "era_purist") {
        depthTitles.push({
          name: t.name,
          titleType: t.titleType,
          description: t.description,
          earnedAt: t.earnedAt ? new Date(t.earnedAt).toISOString() : null,
        });
      } else if (t.titleType === "fusion" || t.titleType === "convergence" || t.titleType === "global" || t.titleType === "editorial" || t.titleType === "bestowed") {
        higherTitles.push({
          name: t.name,
          titleType: t.titleType,
          description: t.description,
          earnedAt: t.earnedAt ? new Date(t.earnedAt).toISOString() : null,
          isDisplayed: t.isDisplayed,
        });
      }
    }

    const genreTracks = Object.entries(genreMaxLevels)
      .map(([genre, data]) => ({
        genre,
        level: data.level,
        levelName: levelNames[data.level - 1] || "Unknown",
        earnedAt: data.earnedAt,
      }))
      .sort((a, b) => b.level - a.level || a.genre.localeCompare(b.genre));

    return NextResponse.json({
      stats: {
        currentStreak: streakData?.currentStreak || 0,
        longestStreak: streakData?.longestStreak || 0,
        currentDayStreak: streakData?.currentDayStreak || 0,
        longestDayStreak: streakData?.longestDayStreak || 0,
        totalPlayed,
        totalSolved,
        winRate,
        avgScore,
        bestScore,
        perfectGames,
        avgClue,
      },
      headline: {
        puzzles: totalPlayed,
        streak: streakData?.currentStreak || 0,
        best: bestScore,
        avg: avgScore,
      },
      genreRadar,
      history: formattedHistory,
      badges: {
        earned: earnedBadges,
        all: allBadges,
      },
      titles: {
        displayed: displayedTitle,
        genreTracks,
        depthTitles,
        higherTitles,
      },
    });
  } catch (err) {
    console.error("Profile data error:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
