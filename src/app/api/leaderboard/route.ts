import { auth } from "@/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Mask email for public display: j***@gmail.com
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local[0]}***@${domain}`;
}

export async function GET(request: Request) {
  const session = await auth();
  const currentPlayerId = session?.user?.playerProfileId || null;

  const { searchParams } = new URL(request.url);
  const metric = searchParams.get("metric") || "total_score";
  const genre = searchParams.get("genre") || null;

  try {
      // Build genre filter clause
      const genreJoin = genre
        ? sql`JOIN puzzles p ON pph.puzzle_id = p.id AND ${genre} = ANY(p.tags)`
        : sql``;

      let leaderboardQuery;

    switch (metric) {
      case "total_score":
        leaderboardQuery = sql`
          SELECT pph.player_id,
                 SUM(pph.score)::int AS metric_value,
                 COUNT(*)::int AS puzzles_played
          FROM player_puzzle_history pph
          ${genreJoin}
          WHERE pph.solved = true
          GROUP BY pph.player_id
          ORDER BY metric_value DESC
          LIMIT 20
        `;
        break;

      case "avg_score":
        leaderboardQuery = sql`
          SELECT pph.player_id,
                 ROUND(AVG(pph.score))::int AS metric_value,
                 COUNT(*)::int AS puzzles_played
          FROM player_puzzle_history pph
          ${genreJoin}
          WHERE pph.solved = true
          GROUP BY pph.player_id
          HAVING COUNT(*) >= 5
          ORDER BY metric_value DESC
          LIMIT 20
        `;
        break;

      case "best_streak":
        if (genre) {
          // Genre-specific streaks need manual calculation
          leaderboardQuery = sql`
            WITH genre_results AS (
              SELECT pph.player_id, pph.solved, pph.completed_at
              FROM player_puzzle_history pph
              JOIN puzzles p ON pph.puzzle_id = p.id
              WHERE ${genre} = ANY(p.tags)
              ORDER BY pph.player_id, pph.completed_at
            ),
            streaks AS (
              SELECT player_id, solved,
                     ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY completed_at)
                     - ROW_NUMBER() OVER (PARTITION BY player_id, solved ORDER BY completed_at) AS grp
              FROM genre_results
            ),
            max_streaks AS (
              SELECT player_id, MAX(cnt)::int AS metric_value
              FROM (
                SELECT player_id, COUNT(*)::int AS cnt
                FROM streaks WHERE solved = true
                GROUP BY player_id, grp
              ) sub
              GROUP BY player_id
            )
            SELECT ms.player_id, ms.metric_value,
                   (SELECT COUNT(*)::int FROM player_puzzle_history WHERE player_id = ms.player_id) AS puzzles_played
            FROM max_streaks ms
            WHERE ms.metric_value > 0
            ORDER BY ms.metric_value DESC
            LIMIT 20
          `;
        } else {
          leaderboardQuery = sql`
            SELECT s.player_id,
                   s.longest_streak AS metric_value,
                   (SELECT COUNT(*)::int FROM player_puzzle_history WHERE player_id = s.player_id) AS puzzles_played
            FROM streaks s
            WHERE s.longest_streak > 0
            ORDER BY s.longest_streak DESC
            LIMIT 20
          `;
        }
        break;

      case "perfect_games":
        leaderboardQuery = sql`
          SELECT pph.player_id,
                 COUNT(*)::int AS metric_value,
                 (SELECT COUNT(*)::int FROM player_puzzle_history WHERE player_id = pph.player_id) AS puzzles_played
          FROM player_puzzle_history pph
          ${genreJoin}
          WHERE pph.solved = true AND pph.wrong_guesses = 0
          GROUP BY pph.player_id
          ORDER BY metric_value DESC
          LIMIT 20
        `;
        break;

      case "early_guesses":
        leaderboardQuery = sql`
          SELECT pph.player_id,
                 COUNT(*)::int AS metric_value,
                 (SELECT COUNT(*)::int FROM player_puzzle_history WHERE player_id = pph.player_id) AS puzzles_played
          FROM player_puzzle_history pph
          ${genreJoin}
          WHERE pph.solved = true AND pph.guessed_at_clue <= 2
          GROUP BY pph.player_id
          ORDER BY metric_value DESC
          LIMIT 20
        `;
        break;

      default:
        return NextResponse.json({ error: "Invalid metric" }, { status: 400 });
    }

    const rows = await db.execute(leaderboardQuery);

    // Get player details (display name, email, title) for all player_ids
    const playerIds = rows.rows.map((r: any) => r.player_id as string);

    if (playerIds.length === 0) {
      return NextResponse.json({ entries: [], currentPlayerRank: null });
    }

    // Fetch player details
    const playerDetails = await db.execute(sql`
      SELECT
        pp.id AS player_id,
        pp.display_name,
        pp.email,
        t.name AS title_name,
        t.title_type,
        t.level AS title_level
      FROM player_profiles pp
      LEFT JOIN player_titles pt ON pt.player_id = pp.id AND pt.is_displayed = true
      LEFT JOIN titles t ON t.id = pt.title_id
      WHERE pp.id = ANY(${sql.raw(`ARRAY[${playerIds.map(id => `'${id}'`).join(",")}]::uuid[]`)})
    `);

    const detailMap: Record<string, any> = {};
    for (const d of playerDetails.rows as any[]) {
      detailMap[d.player_id] = d;
    }

    // Build entries
    const entries = rows.rows.map((row: any, i: number) => {
      const detail = detailMap[row.player_id] || {};
      const displayName = detail.display_name || maskEmail(detail.email || "Unknown");
      const isCurrentPlayer = row.player_id === currentPlayerId;

      return {
        rank: i + 1,
        playerId: row.player_id,
        displayName,
        title: detail.title_name || null,
        titleType: detail.title_type || null,
        titleLevel: detail.title_level || null,
        puzzlesPlayed: Number(row.puzzles_played),
        metricValue: Number(row.metric_value),
        isYou: isCurrentPlayer,
      };
    });

    // Find current player's rank if not in top 20
    let currentPlayerRank = null;
    const inTop20 = entries.find((e: any) => e.isYou);

    if (!inTop20 && currentPlayerId) {
      // Run count of players ahead of current player
      const currentPlayerMetric = await getPlayerMetric(currentPlayerId, metric, genre);
      if (currentPlayerMetric !== null) {
        const aheadResult = await getPlayersAhead(currentPlayerId, metric, genre, currentPlayerMetric);
        const detail = detailMap[currentPlayerId] || {};

        // Fetch detail if not already loaded
        let playerDetail = detail;
        if (!detail.email) {
          const pd = await db.execute(sql`
            SELECT pp.display_name, pp.email, t.name AS title_name, t.title_type, t.level AS title_level
            FROM player_profiles pp
            LEFT JOIN player_titles pt ON pt.player_id = pp.id AND pt.is_displayed = true
            LEFT JOIN titles t ON t.id = pt.title_id
            WHERE pp.id = ${currentPlayerId}
          `);
          playerDetail = pd.rows[0] || {};
        }

        currentPlayerRank = {
          rank: aheadResult + 1,
          displayName: playerDetail.display_name || maskEmail(playerDetail.email || "Unknown"),
          title: playerDetail.title_name || null,
          metricValue: currentPlayerMetric,
          puzzlesPlayed: 0, // Not critical for the "your rank" footer
          isYou: true,
        };
      }
    }

    return NextResponse.json({ entries, currentPlayerRank });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}

// Helper: get a specific player's metric value
async function getPlayerMetric(
  playerId: string,
  metric: string,
  genre: string | null
): Promise<number | null> {
  const genreJoin = genre
    ? sql`JOIN puzzles p ON pph.puzzle_id = p.id AND ${genre} = ANY(p.tags)`
    : sql``;

  let query;
  switch (metric) {
    case "total_score":
      query = sql`SELECT COALESCE(SUM(pph.score), 0)::int AS val FROM player_puzzle_history pph ${genreJoin} WHERE pph.player_id = ${playerId} AND pph.solved = true`;
      break;
    case "avg_score":
      query = sql`SELECT COALESCE(ROUND(AVG(pph.score)), 0)::int AS val FROM player_puzzle_history pph ${genreJoin} WHERE pph.player_id = ${playerId} AND pph.solved = true`;
      break;
    case "best_streak":
      query = sql`SELECT COALESCE(longest_streak, 0)::int AS val FROM streaks WHERE player_id = ${playerId}`;
      break;
    case "perfect_games":
      query = sql`SELECT COUNT(*)::int AS val FROM player_puzzle_history pph ${genreJoin} WHERE pph.player_id = ${playerId} AND pph.solved = true AND pph.wrong_guesses = 0`;
      break;
    case "early_guesses":
      query = sql`SELECT COUNT(*)::int AS val FROM player_puzzle_history pph ${genreJoin} WHERE pph.player_id = ${playerId} AND pph.solved = true AND pph.guessed_at_clue <= 2`;
      break;
    default:
      return null;
  }

  const result = await db.execute(query);
  return result.rows[0] ? Number((result.rows[0] as any).val) : null;
}

// Helper: count players ahead of a given metric value
async function getPlayersAhead(
  playerId: string,
  metric: string,
  genre: string | null,
  value: number
): Promise<number> {
  const genreJoin = genre
    ? sql`JOIN puzzles p ON pph.puzzle_id = p.id AND ${genre} = ANY(p.tags)`
    : sql``;

  let query;
  switch (metric) {
    case "total_score":
      query = sql`SELECT COUNT(DISTINCT pph.player_id)::int AS cnt FROM player_puzzle_history pph ${genreJoin} WHERE pph.solved = true GROUP BY pph.player_id HAVING SUM(pph.score) > ${value}`;
      break;
    case "avg_score":
      query = sql`SELECT COUNT(*)::int AS cnt FROM (SELECT pph.player_id FROM player_puzzle_history pph ${genreJoin} WHERE pph.solved = true GROUP BY pph.player_id HAVING COUNT(*) >= 5 AND ROUND(AVG(pph.score)) > ${value}) sub`;
      break;
    case "best_streak":
      query = sql`SELECT COUNT(*)::int AS cnt FROM streaks WHERE longest_streak > ${value}`;
      break;
    case "perfect_games":
      query = sql`SELECT COUNT(*)::int AS cnt FROM (SELECT pph.player_id FROM player_puzzle_history pph ${genreJoin} WHERE pph.solved = true AND pph.wrong_guesses = 0 GROUP BY pph.player_id HAVING COUNT(*) > ${value}) sub`;
      break;
    case "early_guesses":
      query = sql`SELECT COUNT(*)::int AS cnt FROM (SELECT pph.player_id FROM player_puzzle_history pph ${genreJoin} WHERE pph.solved = true AND pph.guessed_at_clue <= 2 GROUP BY pph.player_id HAVING COUNT(*) > ${value}) sub`;
      break;
    default:
      return 0;
  }

  const result = await db.execute(query);
  return result.rows[0] ? Number((result.rows[0] as any).cnt) : 0;
}
