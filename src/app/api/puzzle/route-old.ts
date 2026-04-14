import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, asc, sql, and, notInArray, isNotNull } from "drizzle-orm";
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
    .replace(/\bn['']?\b/g, "and")
    .replace(/[&+]/g, "and")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAlbumName(str: string): string {
  return normalize(
    str
      // Strip parenthetical editions: (Deluxe Edition), (Remastered), etc.
      .replace(/\s*\([^)]*(?:edition|remaster|deluxe|special|bonus|anniversary|expanded|collector)[^)]*\)/gi, "")
      // Strip bracket editions: [Deluxe], [Remastered], etc.
      .replace(/\s*\[[^\]]*(?:edition|remaster|deluxe|special|bonus|anniversary|expanded|collector)[^\]]*\]/gi, "")
      .trim()
  );
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

function isCorrectGuess(guess: string, answer: string, mode: string = "artist"): boolean {
  const normalizeFunc = mode === "album" ? normalizeAlbumName : normalize;
  const ng = normalizeFunc(guess);
  const na = normalizeFunc(answer);
  if (ng === na) return true;

  const ngNoThe = ng.replace(/^the /, "");
  const naNoThe = na.replace(/^the /, "");
  if (ngNoThe === naNoThe) return true;

  const maxDist = na.length <= 8 ? 1 : 2;
  if (levenshtein(ng, na) <= maxDist) return true;
  if (levenshtein(ngNoThe, naNoThe) <= maxDist) return true;

  // Album mode: also try matching against stripped version of the answer
  if (mode === "album") {
    const naStripped = normalize(answer);
    if (ng === naStripped) return true;
    if (levenshtein(ng, naStripped) <= maxDist) return true;
  }

  return false;
}

// ── Song selection: lock top 3 hits, rotate deep cuts (Artist mode only) ─

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

// ── Album mode: use all songs, no rotation ──────────────────────────────

function selectAlbumSongs(
  allSongs: { displayOrder: number; songName: string }[]
): { order: number; name: string }[] {
  return allSongs.map((s, i) => ({ order: i + 1, name: s.songName }));
}

// ── GET: Fetch a random puzzle ──────────────────────────────────────────

export async function GET(request: Request) {
  noStore();

  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const mode = searchParams.get("mode") || "artist";
    const excludeRaw = searchParams.get("exclude");

    const excludedIds: string[] = excludeRaw
      ? excludeRaw.split(",").filter(Boolean)
      : [];

    const conditions = [eq(schema.puzzles.published, true)];

    if (tag) {
      conditions.push(sql`${tag} = ANY(${schema.puzzles.tags})`);
    }

    // Filter by mode: album puzzles have album_id, artist puzzles have artist_id
    if (mode === "album") {
      conditions.push(isNotNull(schema.puzzles.albumId));
      if (excludedIds.length > 0) {
        conditions.push(
          notInArray(schema.puzzles.albumId, excludedIds)
        );
      }
    } else {
      conditions.push(isNotNull(schema.puzzles.artistId));
      if (excludedIds.length > 0) {
        conditions.push(
          notInArray(schema.puzzles.artistId, excludedIds)
        );
      }
    }

    // Fetch randomized candidates, find first with enough songs
    const candidates = await db
      .select({
        id: schema.puzzles.id,
        mode: schema.puzzles.mode,
        primaryGenre: schema.puzzles.primaryGenre,
        tags: schema.puzzles.tags,
        artistId: schema.puzzles.artistId,
        albumId: schema.puzzles.albumId,
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

    // Album mode uses all songs; Artist mode uses rotation
    const selectedSongs = mode === "album"
      ? selectAlbumSongs(allSongRows)
      : selectSongs(allSongRows);

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
        albumId: puzzle.albumId,
        mode: mode,
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
      .select({
        artistId: schema.puzzles.artistId,
        albumId: schema.puzzles.albumId,
      })
      .from(schema.puzzles)
      .where(eq(schema.puzzles.id, puzzleId))
      .then((rows) => rows[0]);

    if (!puzzleRow) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    // ── Album mode ────────────────────────────────────────────────────
    if (puzzleRow.albumId) {
      const album = await db
        .select({
          name: schema.albums.name,
          artistId: schema.albums.artistId,
        })
        .from(schema.albums)
        .where(eq(schema.albums.id, puzzleRow.albumId))
        .then((rows) => rows[0]);

      if (!album) {
        return NextResponse.json({ error: "Album not found" }, { status: 404 });
      }

      const artist = await db
        .select({ name: schema.artists.name })
        .from(schema.artists)
        .where(eq(schema.artists.id, album.artistId))
        .then((rows) => rows[0]);

      const artistName = artist?.name || "Unknown";

      if (action === "reveal") {
        return NextResponse.json(
          { answer: album.name, artist: artistName },
          { headers: { "Cache-Control": "no-store" } }
        );
      }

      if (!guess || !guess.trim()) {
        return NextResponse.json({ error: "guess required" }, { status: 400 });
      }

      const correct = isCorrectGuess(guess.trim(), album.name, "album");

      return NextResponse.json(
        { correct, ...(correct ? { answer: album.name, artist: artistName } : {}) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // ── Artist mode (default) ─────────────────────────────────────────
    if (!puzzleRow.artistId) {
      return NextResponse.json({ error: "Puzzle has no subject" }, { status: 404 });
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
