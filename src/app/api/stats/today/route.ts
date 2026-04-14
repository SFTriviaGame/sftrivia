import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/stats/today
// Returns the number of puzzles completed today (social proof counter)

export async function GET() {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM player_puzzle_history
      WHERE completed_at >= CURRENT_DATE
    `);

    const count = Number((result.rows[0] as any)?.count || 0);

    return NextResponse.json(
      { playersToday: count },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch {
    return NextResponse.json({ playersToday: 0 });
  }
}
