import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

// All planned genres/decades — shown even if empty
const ALL_GENRES = [
  "60s", "70s", "80s", "90s", "2000s", "2010s",
  "hair-metal", "classic-rock", "pop", "hip-hop", "country",
  "metal", "punk", "jazz", "blues", "electronic", "r-and-b",
  "indie", "folk", "reggae", "latin", "grunge", "new-wave",
  "disco-funk", "southern-rock", "prog-rock", "emo", "nu-metal",
];

export async function GET() {
  noStore();

  try {
    // Get all published puzzles with their tags and mode info
    const allPuzzles = await db
      .select({
        id: schema.puzzles.id,
        tags: schema.puzzles.tags,
        artistId: schema.puzzles.artistId,
        albumId: schema.puzzles.albumId,
      })
      .from(schema.puzzles)
      .where(eq(schema.puzzles.published, true));

    // Build counts per genre
    const genreStats: Record<string, { artist: number; album: number }> = {};

    // Initialize all genres
    for (const genre of ALL_GENRES) {
      genreStats[genre] = { artist: 0, album: 0 };
    }

    // Count puzzles per tag per mode
    for (const puzzle of allPuzzles) {
      const tags = puzzle.tags || [];
      const isAlbum = puzzle.albumId !== null;
      const isArtist = puzzle.artistId !== null;

      for (const tag of tags) {
        if (!tag) continue;
        if (!genreStats[tag]) {
          genreStats[tag] = { artist: 0, album: 0 };
        }
        if (isAlbum) {
          genreStats[tag].album++;
        } else if (isArtist) {
          genreStats[tag].artist++;
        }
      }
    }

    // Build response array
    const genres = ALL_GENRES.map((genre) => ({
      id: genre,
      artistCount: genreStats[genre]?.artist || 0,
      albumCount: genreStats[genre]?.album || 0,
      totalCount: (genreStats[genre]?.artist || 0) + (genreStats[genre]?.album || 0),
    }));

    return NextResponse.json(
      { genres },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Genres API error:", error);
    return NextResponse.json({ error: "Failed to load genres" }, { status: 500 });
  }
}
