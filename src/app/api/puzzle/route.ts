import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, asc, sql } from "drizzle-orm";
import * as schema from "@/db/schema";

export const dynamic = "force-dynamic";

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

export async function GET() {
  try {
    // Pick a random published puzzle
    const puzzle = await db
      .select()
      .from(schema.puzzles)
      .where(eq(schema.puzzles.published, true))
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .then((rows) => rows[0]);

    if (!puzzle) {
      return NextResponse.json({ error: "No puzzle found" }, { status: 404 });
    }

    // Get the songs in reveal order — song name only
    const songRows = await db
      .select({
        displayOrder: schema.puzzleSongs.displayOrder,
        songName: schema.songs.name,
      })
      .from(schema.puzzleSongs)
      .innerJoin(schema.songs, eq(schema.puzzleSongs.songId, schema.songs.id))
      .where(eq(schema.puzzleSongs.puzzleId, puzzle.id))
      .orderBy(asc(schema.puzzleSongs.displayOrder));

    // Get the answer (artist name for artist mode)
    let answer = "";
    let answerNormalized = "";
    if (puzzle.artistId) {
      const artist = await db
        .select()
        .from(schema.artists)
        .where(eq(schema.artists.id, puzzle.artistId))
        .then((rows) => rows[0]);
      if (artist) {
        answer = artist.name;
        answerNormalized = artist.nameNormalized;
      }
    }

    return NextResponse.json({
      id: puzzle.id,
      mode: puzzle.mode,
      genre: puzzle.primaryGenre,
      songs: songRows.map((s) => ({
        order: s.displayOrder,
        name: s.songName,
      })),
      answer,
      answerNormalized,
      totalSongs: songRows.length,
    });
  } catch (error) {
    console.error("Puzzle API error:", error);
    return NextResponse.json(
      { error: "Failed to load puzzle" },
      { status: 500 }
    );
  }
}
