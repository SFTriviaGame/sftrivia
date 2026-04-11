import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, asc, sql, and } from "drizzle-orm";
import * as schema from "@/db/schema";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

export async function GET(request: Request) {
  noStore();

  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    // Build query conditions
    const conditions = [eq(schema.puzzles.published, true)];
    if (tag) {
      conditions.push(sql`${tag} = ANY(${schema.puzzles.tags})`);
    }

    const puzzle = await db
      .select()
      .from(schema.puzzles)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .then((rows) => rows[0]);

    if (!puzzle) {
      return NextResponse.json({ error: "No puzzle found" }, { status: 404 });
    }

    const songRows = await db
      .select({
        displayOrder: schema.puzzleSongs.displayOrder,
        songName: schema.songs.name,
      })
      .from(schema.puzzleSongs)
      .innerJoin(schema.songs, eq(schema.puzzleSongs.songId, schema.songs.id))
      .where(eq(schema.puzzleSongs.puzzleId, puzzle.id))
      .orderBy(asc(schema.puzzleSongs.displayOrder));

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

    // Get available tags for the category picker
    const allTags = await db
      .select({ tags: schema.puzzles.tags })
      .from(schema.puzzles)
      .where(eq(schema.puzzles.published, true));

    const tagSet = new Set<string>();
    allTags.forEach((row) => {
      if (row.tags) row.tags.forEach((t) => { if (t) tagSet.add(t); });
    });

    return NextResponse.json(
      {
        id: puzzle.id,
        mode: puzzle.mode,
        genre: puzzle.primaryGenre,
        tags: puzzle.tags || [],
        songs: songRows.map((s) => ({
          order: s.displayOrder,
          name: s.songName,
        })),
        answer,
        answerNormalized,
        totalSongs: songRows.length,
        availableTags: Array.from(tagSet).sort(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Puzzle API error:", error);
    return NextResponse.json(
      { error: "Failed to load puzzle" },
      { status: 500 }
    );
  }
}
