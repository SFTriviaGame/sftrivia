import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, asc, sql, and, notInArray } from "drizzle-orm";
import * as schema from "@/db/schema";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const MIN_SONGS = 5;
const SONGS_TO_SHOW = 9;
const LOCKED_HITS = 3;

// ── Shared fuzzy matching ───────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= b.length; j++) {
      if (i === 0) {
        matrix[i][j] = j;
      } else {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

function isCorrectGuess(guess: string, answer: string): boolean {
  const ng = normalize(guess);
  const na = normalize(answer);
  if (ng === na) return true;
  const ngNoThe = ng.replace(/^the /, "");
  const naNoThe = na.replace(/^the /, "");
  if (ngNoThe === naNoThe) return true;
  const maxDist = na.length <= 8 ? 1 : 2;
  if (levenshtein(ng, na) <= maxDist) return true;
  if (levenshtein(ngNoThe, naNoThe) <= maxDist) return true;
  return false;
}

// ── Song selection: lock top 3 hits, rotate deep cuts ───────────────────

function selectSongs(
  allSongs: { displayOrder: number; songName: string }[]
): { order: number; name: string }[] {
  const total = allSongs.length;

  if (total <= SONGS_TO_SHOW) {
    return allSongs.map((s, i) => ({ order: i + 1, name: s.songName }));
  }

  // Lock the top 3 most popular (highest displayOrder = last in sorted array)
  const locked = allSongs.slice(total - LOCKED_HITS);

  // Randomly pick 6 from the deep cut pool
  const deepCutPool = allSongs.slice(0, total - LOCKED_HITS);
  const shuffled = [...deepCutPool].sort(() => Math.random() - 0.5);
  const selectedDeepCuts = shuffled.slice(0, SONGS_TO_SHOW - LOCKED_HITS);

  // Combine and sort by displayOrder ASC (deep cuts first, hits last)
  const combined = [...selectedDeepCuts, ...locked].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return combined.map((s, i) => ({ order: i + 1, name: s.songName }));
}

// ── GET: Fetch a random puzzle ──────────────────────────────────────────

export async function GET(request: Request) {
  noStore();

  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const excludeRaw = searchParams.get("exclude");

    const excludedArtistIds: string[] = excludeRaw
      ? excludeRaw.split(",").filter(Boolean)
      : [];

    const conditions = [eq(schema.puzzles.published, true)];
    if (tag) {
      conditions.push(sql`${tag} = ANY(${schema.puzzles.tags})`);
    }
    if (excludedArtistIds.length > 0) {
      conditions.push(
        notInArray(schema.puzzles.artistId, excludedArtistIds)
      );
    }

    // Fetch randomized candidates, find first with enough songs
    const candidates = await db
      .select({
        id: schema.puzzles.id,
        mode: schema.puzzles.mode,
        primaryGenre: schema.puzzles.primaryGenre,
        tags: schema.puzzles.tags,
        artistId: schema.puzzles.artistId,
      })
      .from(schema.puzzles)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`);

    let puzzle: (typeof candidates)[0] | null = null;

    for (const candidate of candidates) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.puzzleSongs)
        .where(eq(schema.puzzleSongs.puzzleId, candidate.id));

      if (Number(countResult[0]?.count ?? 0) >= MIN_SONGS) {
        puzzle = candidate;
        break;
      }
    }

    if (!puzzle) {
      return NextResponse.json({ error: "No puzzle found" }, { status: 404 });
    }

    const allSongRows = await db
      .select({
        displayOrder: schema.puzzleSongs.displayOrder,
        songName: schema.songs.name,
      })
      .from(schema.puzzleSongs)
      .innerJoin(schema.songs, eq(schema.puzzleSongs.songId, schema.songs.id))
      .where(eq(schema.puzzleSongs.puzzleId, puzzle.id))
      .orderBy(asc(schema.puzzleSongs.displayOrder));

    const selectedSongs = selectSongs(allSongRows);

    const allTags = await db
      .select({ tags: schema.puzzles.tags })
      .from(schema.puzzles)
      .where(eq(schema.puzzles.published, true));

    const tagSet = new Set<string>();
    allTags.forEach((row) => {
      if (row.tags) row.tags.forEach((t) => { if (t) tagSet.add(t); });
    });

    // Answer is NOT sent to the client
    return NextResponse.json(
      {
        id: puzzle.id,
        artistId: puzzle.artistId,
        mode: puzzle.mode,
        genre: puzzle.primaryGenre,
        tags: puzzle.tags || [],
        songs: selectedSongs,
        totalSongs: selectedSongs.length,
        availableTags: Array.from(tagSet).sort(),
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
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

// ── POST: Validate a guess or reveal the answer ─────────────────────────

export async function POST(request: Request) {
  noStore();

  try {
    const body = await request.json();
    const { puzzleId, guess, action } = body as {
      puzzleId: string;
      guess?: string;
      action: "guess" | "reveal";
    };

    if (!puzzleId) {
      return NextResponse.json({ error: "puzzleId required" }, { status: 400 });
    }

    const puzzleRow = await db
      .select({ artistId: schema.puzzles.artistId })
      .from(schema.puzzles)
      .where(eq(schema.puzzles.id, puzzleId))
      .then((rows) => rows[0]);

    if (!puzzleRow?.artistId) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    const artist = await db
      .select({ name: schema.artists.name })
      .from(schema.artists)
      .where(eq(schema.artists.id, puzzleRow.artistId))
      .then((rows) => rows[0]);

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    if (action === "reveal") {
      return NextResponse.json(
        { answer: artist.name },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!guess || !guess.trim()) {
      return NextResponse.json({ error: "guess required" }, { status: 400 });
    }

    const correct = isCorrectGuess(guess.trim(), artist.name);

    return NextResponse.json(
      { correct, ...(correct ? { answer: artist.name } : {}) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Puzzle validation error:", error);
    return NextResponse.json(
      { error: "Validation failed" },
      { status: 500 }
    );
  }
}
