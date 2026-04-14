// =============================================================
// DEEP CUT — Title Engine
// src/lib/title-engine.ts
//
// Evaluates all title tiers after each puzzle completion.
// Called from /api/score after badge evaluation.
// =============================================================

/* eslint-disable @typescript-eslint/no-unused-vars */

import { db } from "@/db";
import {
  puzzles,
  artists,
  albums,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// =============================================================
// TYPES
// =============================================================

interface TitleEvalResult {
  newTitles: string[];
  displayedTitle: string | null;
  displayedTier: number | null;
}

interface GenreStats {
  totalPlayed: number;
  wins: number;
  winRate: number;
  avgScore: number;
  giveUpRate: number;
  bestStreak: number;
  perfectGames: number;
  avgClue: number;
}

// =============================================================
// CONSTANTS — TIER 1 THRESHOLDS
// =============================================================

const GENRE_THRESHOLDS: Record<number, Partial<GenreStats>> = {
  1: { wins: 1 },
  2: { wins: 8, winRate: 0.5, giveUpRate: 0.4 },
  3: { wins: 20, winRate: 0.6, avgScore: 400, giveUpRate: 0.25, bestStreak: 3 },
  4: {
    wins: 50,
    winRate: 0.7,
    avgScore: 550,
    giveUpRate: 0.15,
    bestStreak: 5,
    perfectGames: 3,
  },
  5: {
    wins: 100,
    winRate: 0.8,
    avgScore: 650,
    giveUpRate: 0.1,
    bestStreak: 8,
    perfectGames: 10,
    avgClue: 5,
  },
};

const LEVEL_NAMES = ["Initiate", "Student", "Scholar", "Master", "Legend"];

// =============================================================
// CONSTANTS — DEPTH TITLE THRESHOLDS
// =============================================================

const ARTIST_SCHOLAR_THRESHOLDS = {
  wins: 3,
  winRate: 0.75,
  avgScore: 500,
  avgClue: 4,
};

const ALBUM_ARCHIVIST_THRESHOLDS = {
  albumWins: 3,
  winRate: 0.7,
  avgScore: 450,
};

const ERA_PURIST_THRESHOLDS = {
  decadeGenreLevel: 3, // Scholar+
  totalDecadePuzzles: 25,
  // Also requires Artist Scholar
};

// =============================================================
// CONSTANTS — GENRE SLUG → DISPLAY NAME MAP
// =============================================================

const GENRE_DISPLAY_NAMES: Record<string, string> = {
  "hair-metal": "Hair Metal",
  "classic-rock": "Classic Rock",
  pop: "Pop",
  "hip-hop": "Hip-Hop",
  country: "Country",
  metal: "Metal",
  punk: "Punk",
  jazz: "Jazz",
  blues: "Blues",
  electronic: "Electronic",
  "r-and-b": "R&B",
  "rnb-soul": "R&B",
  indie: "Indie",
  "60s": "60s",
  "70s": "70s",
  "80s": "80s",
  "90s": "90s",
  "2000s": "2000s",
  "2010s": "2010s",
  rock: "Rock",
  reggae: "Reggae",
  latin: "Latin",
  folk: "Folk",
  motown: "Motown",
  "brit-pop": "Brit Pop",
  grunge: "Grunge",
  "new-wave": "New Wave",
  "disco-funk": "Disco/Funk",
  "singer-songwriter": "Singer-Songwriter",
  "southern-rock": "Southern Rock",
  "prog-rock": "Prog Rock",
  emo: "Emo",
  "nu-metal": "Nu Metal",
};

function genreDisplayName(slug: string): string {
  return (
    GENRE_DISPLAY_NAMES[slug] ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

// =============================================================
// CONSTANTS — TIER 2 FUSION MAP (15 starter titles)
// Keys are sorted alphabetically: "genre-a|genre-b"
// =============================================================

const FUSION_MAP: Record<string, string> = {
  "classic-rock|hair-metal": "Riff Alchemist",
  "hair-metal|pop": "Guilty Pleasure Connoisseur",
  "80s|hair-metal": "Sunset Strip Veteran",
  "blues|classic-rock": "Roots Rocker",
  "70s|classic-rock": "Vinyl Purist",
  "blues|jazz": "Smoky Room Scholar",
  "jazz|r-and-b": "Groove Theorist",
  "jazz|rnb-soul": "Groove Theorist",
  "hip-hop|r-and-b": "Rhythm Fusionist",
  "hip-hop|rnb-soul": "Rhythm Fusionist",
  "hip-hop|pop": "Crossover King",
  "electronic|pop": "Synth Pop Architect",
  "metal|punk": "Thrash Diplomat",
  "electronic|indie": "Bedroom Producer",
  "80s|pop": "Neon Pop Virtuoso",
  "90s|hip-hop": "Golden Era Historian",
  "90s|indie": "Slacker Savant",
};

function fusionKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

function getFusionTitle(genreA: string, genreB: string): string {
  const key = fusionKey(genreA, genreB);
  if (FUSION_MAP[key]) return FUSION_MAP[key];
  return `${genreDisplayName(genreA)} × ${genreDisplayName(genreB)} Fusion`;
}

// =============================================================
// CONSTANTS — TIER 3 CONVERGENCE MAP
// Keys: sorted "a|b|c"
// If no mapped title, no T3 granted (player keeps highest T2)
// =============================================================

const CONVERGENCE_MAP: Record<string, string> = {
  "classic-rock|hair-metal|metal": "Virtuoso of the Void",
  "blues|classic-rock|jazz": "The Continuum",
  "electronic|hip-hop|pop": "The Polymath",
  "70s|80s|classic-rock": "The Vinyl Archaeologist",
  "80s|hair-metal|pop": "The Neon Alchemist",
  "blues|hip-hop|jazz": "The Groove Philosopher",
};

function convergenceKey(a: string, b: string, c: string): string {
  return [a, b, c].sort().join("|");
}

// =============================================================
// CONSTANTS — TIER WEIGHTS FOR DISPLAY PRIORITY
// =============================================================

const TIER_PRIORITY: Record<string, number> = {
  bestowed: 60,
  editorial: 55,
  global: 50,
  intersection: 45,
  convergence: 40,
  fusion: 30,
  era_purist: 25,
  depth_album: 22,
  depth_artist: 20,
  genre: 10, // + level (1-5) for sub-ordering
};

// =============================================================
// MAIN ENTRY POINT
// =============================================================

export async function evaluateTitles(
  playerId: string,
  puzzleId: string
): Promise<TitleEvalResult> {
  const newTitles: string[] = [];

  try {
    // 1. Get puzzle info
    const puzzle = await db
      .select({
        id: puzzles.id,
        tags: puzzles.tags,
        artistId: puzzles.artistId,
        albumId: puzzles.albumId,
        mode: puzzles.mode,
      })
      .from(puzzles)
      .where(eq(puzzles.id, puzzleId))
      .then((rows) => rows[0]);

    if (!puzzle) return { newTitles: [], displayedTitle: null, displayedTier: null };

    const tags: string[] = puzzle.tags || [];

    // 2. TIER 1 — Genre Mastery (for each tag on this puzzle)
// Skip decade tags — decades require breadth across genres, not their own track
for (const genre of tags) {
  if (/^\d{2,4}s$/.test(genre)) continue;

      // Check levels from highest to lowest
      for (let level = 5; level >= 1; level--) {
        if (meetsGenreThresholds(stats, level)) {
          const granted = await grantGenreTitle(playerId, genre, level, puzzleId);
          if (granted) newTitles.push(granted);
          break;
        }
      }
    }

    // 3. DEPTH TITLES
    let artistId = puzzle.artistId;
    if (!artistId && puzzle.albumId) {
      const album = await db
        .select({ artistId: albums.artistId })
        .from(albums)
        .where(eq(albums.id, puzzle.albumId))
        .then((rows) => rows[0]);
      if (album) artistId = album.artistId;
    }

    if (artistId) {
      // 3a. Artist Scholar
      const artistScholar = await checkArtistScholar(playerId, artistId, puzzleId);
      if (artistScholar) newTitles.push(artistScholar);

      // 3b. Album Archivist (only if this was an album mode puzzle)
      if (puzzle.mode === "album") {
        const albumArchivist = await checkAlbumArchivist(playerId, artistId, puzzleId);
        if (albumArchivist) newTitles.push(albumArchivist);
      }

      // 3c. Era Purist (decade + artist)
      const eraPurist = await checkEraPurist(playerId, artistId, tags, puzzleId);
      if (eraPurist) newTitles.push(eraPurist);
    }

    // 4. TIER 2 — Fusion (two genres at Scholar+)
    const fusionTitles = await checkFusionTitles(playerId, puzzleId);
    newTitles.push(...fusionTitles);

    // 5. TIER 3 — Convergence (three genres at Scholar+)
    const convergenceTitles = await checkConvergenceTitles(playerId, puzzleId);
    newTitles.push(...convergenceTitles);

    // 6. Update displayed title (highest tier wins)
    const displayed = await updateDisplayedTitle(playerId);

    return {
      newTitles,
      displayedTitle: displayed?.name || null,
      displayedTier: displayed?.tierPriority || null,
    };
  } catch (error) {
    console.error("Title engine error:", error);
    return { newTitles: [], displayedTitle: null, displayedTier: null };
  }
}

// =============================================================
// GENRE STATS CALCULATION
// =============================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function calculateGenreStats(
  playerId: string,
  genre: string
): Promise<GenreStats> {
  const statsResult = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total_played,
      COUNT(*) FILTER (WHERE pph.solved = true)::int AS wins,
      COALESCE(AVG(ps.score) FILTER (WHERE pph.solved = true), 0)::float AS avg_score,
      COUNT(*) FILTER (WHERE pph.solved = true AND pph.wrong_guesses = 0)::int AS perfect_games,
      COALESCE(AVG(pph.guessed_at_clue) FILTER (WHERE pph.solved = true), 99)::float AS avg_clue,
      COUNT(*) FILTER (WHERE pph.gave_up = true)::int AS give_ups,
      COUNT(*) FILTER (WHERE pph.solved = false AND pph.gave_up = false)::int AS timeouts
    FROM player_puzzle_history pph
    JOIN puzzles p ON pph.puzzle_id = p.id
    LEFT JOIN player_scores ps ON ps.player_id = pph.player_id AND ps.puzzle_id = pph.puzzle_id
    WHERE pph.player_id = ${playerId}
    AND ${genre} = ANY(p.tags)
  `);

  const row = statsResult.rows[0] as any;
  if (!row || row.total_played === 0) {
    return {
      totalPlayed: 0,
      wins: 0,
      winRate: 0,
      avgScore: 0,
      giveUpRate: 0,
      bestStreak: 0,
      perfectGames: 0,
      avgClue: 99,
    };
  }

  const totalPlayed = Number(row.total_played);
  const wins = Number(row.wins);
  const giveUps = Number(row.give_ups);
  const timeouts = Number(row.timeouts);

  // Weighted give-up rate per spec
  const weightedGiveups = giveUps * 0.25 + timeouts * 0.1;
  const giveUpRate = totalPlayed > 0 ? weightedGiveups / totalPlayed : 0;

  const bestStreak = await calculateGenreStreak(playerId, genre);

  return {
    totalPlayed,
    wins,
    winRate: totalPlayed > 0 ? wins / totalPlayed : 0,
    avgScore: Number(row.avg_score),
    giveUpRate,
    bestStreak,
    perfectGames: Number(row.perfect_games),
    avgClue: Number(row.avg_clue),
  };
}

// =============================================================
// GENRE-SPECIFIC STREAK CALCULATION
// =============================================================

async function calculateGenreStreak(
  playerId: string,
  genre: string
): Promise<number> {
  const results = await db.execute(sql`
    SELECT pph.solved
    FROM player_puzzle_history pph
    JOIN puzzles p ON pph.puzzle_id = p.id
    WHERE pph.player_id = ${playerId}
    AND ${genre} = ANY(p.tags)
    ORDER BY pph.completed_at ASC
  `);

  let bestStreak = 0;
  let currentStreak = 0;

  for (const row of results.rows as any[]) {
    if (row.solved) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return bestStreak;
}

// =============================================================
// TIER 1 — THRESHOLD CHECK & GRANT
// =============================================================

function meetsGenreThresholds(stats: GenreStats, level: number): boolean {
  const thresholds = GENRE_THRESHOLDS[level];
  if (!thresholds) return false;

  if (thresholds.wins !== undefined && stats.wins < thresholds.wins) return false;
  if (thresholds.winRate !== undefined && stats.winRate < thresholds.winRate) return false;
  if (thresholds.avgScore !== undefined && stats.avgScore < thresholds.avgScore) return false;
  if (thresholds.giveUpRate !== undefined && stats.giveUpRate > thresholds.giveUpRate) return false;
  if (thresholds.bestStreak !== undefined && stats.bestStreak < thresholds.bestStreak) return false;
  if (thresholds.perfectGames !== undefined && stats.perfectGames < thresholds.perfectGames) return false;
  if (thresholds.avgClue !== undefined && stats.avgClue > thresholds.avgClue) return false;

  return true;
}

async function grantGenreTitle(
  playerId: string,
  genre: string,
  level: number,
  puzzleId: string
): Promise<string | null> {
  const displayName = genreDisplayName(genre);
  const levelName = LEVEL_NAMES[level - 1];
  const titleName = `${displayName} ${levelName}`;

  // Check if player already has this level or higher in this genre
  const existingHigher = await db.execute(sql`
    SELECT t.level
    FROM player_titles pt
    JOIN titles t ON pt.title_id = t.id
    WHERE pt.player_id = ${playerId}
    AND t.title_type = 'genre'
    AND t.genre = ${genre}
    AND t.level >= ${level}
    LIMIT 1
  `);

  if (existingHigher.rows.length > 0) return null;

  const titleId = await findOrCreateTitle({
    name: titleName,
    titleType: "genre",
    genre,
    level,
    description: levelDescription(level),
  });

  const granted = await grantTitleToPlayer(playerId, titleId);
  return granted ? titleName : null;
}

function levelDescription(level: number): string {
  const descriptions = [
    "The game sees you.",
    "You're paying attention.",
    "You know things most people don't.",
    "This is your genre.",
    "There's nothing left to prove.",
  ];
  return descriptions[level - 1] || "";
}

// =============================================================
// DEPTH — ARTIST SCHOLAR
// =============================================================

async function checkArtistScholar(
  playerId: string,
  artistId: string,
  puzzleId: string
): Promise<string | null> {
  const existing = await db.execute(sql`
    SELECT 1 FROM player_titles pt
    JOIN titles t ON pt.title_id = t.id
    WHERE pt.player_id = ${playerId}
    AND t.title_type = 'depth_artist'
    AND t.artist_id = ${artistId}
    LIMIT 1
  `);
  if (existing.rows.length > 0) return null;

  const statsResult = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total_played,
      COUNT(*) FILTER (WHERE pph.solved = true)::int AS wins,
      COALESCE(AVG(ps.score) FILTER (WHERE pph.solved = true), 0)::float AS avg_score,
      COALESCE(AVG(pph.guessed_at_clue) FILTER (WHERE pph.solved = true), 99)::float AS avg_clue
    FROM player_puzzle_history pph
    JOIN puzzles p ON pph.puzzle_id = p.id
    LEFT JOIN player_scores ps ON ps.player_id = pph.player_id AND ps.puzzle_id = pph.puzzle_id
    LEFT JOIN albums a ON p.album_id = a.id
    WHERE pph.player_id = ${playerId}
    AND (p.artist_id = ${artistId} OR a.artist_id = ${artistId})
  `);

  const row = statsResult.rows[0] as any;
  if (!row) return null;

  const wins = Number(row.wins);
  const totalPlayed = Number(row.total_played);
  const winRate = totalPlayed > 0 ? wins / totalPlayed : 0;
  const avgScore = Number(row.avg_score);
  const avgClue = Number(row.avg_clue);

  const t = ARTIST_SCHOLAR_THRESHOLDS;
  if (wins < t.wins || winRate < t.winRate || avgScore < t.avgScore || avgClue > t.avgClue) {
    return null;
  }

  const artist = await db
    .select({ name: artists.name })
    .from(artists)
    .where(eq(artists.id, artistId))
    .then((rows) => rows[0]);

  if (!artist) return null;

  const titleName = `${artist.name} Scholar`;

  const titleId = await findOrCreateTitle({
    name: titleName,
    titleType: "depth_artist",
    artistId,
    description: `Deep knowledge of ${artist.name}`,
  });

  const granted = await grantTitleToPlayer(playerId, titleId);
  return granted ? titleName : null;
}

// =============================================================
// DEPTH — ALBUM ARCHIVIST
// =============================================================

async function checkAlbumArchivist(
  playerId: string,
  artistId: string,
  puzzleId: string
): Promise<string | null> {
  // Must already have Artist Scholar
  const hasScholar = await db.execute(sql`
    SELECT 1 FROM player_titles pt
    JOIN titles t ON pt.title_id = t.id
    WHERE pt.player_id = ${playerId}
    AND t.title_type = 'depth_artist'
    AND t.artist_id = ${artistId}
    LIMIT 1
  `);
  if (hasScholar.rows.length === 0) return null;

  const existing = await db.execute(sql`
    SELECT 1 FROM player_titles pt
    JOIN titles t ON pt.title_id = t.id
    WHERE pt.player_id = ${playerId}
    AND t.title_type = 'depth_album'
    AND t.artist_id = ${artistId}
    LIMIT 1
  `);
  if (existing.rows.length > 0) return null;

  const statsResult = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total_played,
      COUNT(*) FILTER (WHERE pph.solved = true)::int AS wins,
      COALESCE(AVG(ps.score) FILTER (WHERE pph.solved = true), 0)::float AS avg_score
    FROM player_puzzle_history pph
    JOIN puzzles p ON pph.puzzle_id = p.id
    JOIN albums a ON p.album_id = a.id
    LEFT JOIN player_scores ps ON ps.player_id = pph.player_id AND ps.puzzle_id = pph.puzzle_id
    WHERE pph.player_id = ${playerId}
    AND a.artist_id = ${artistId}
    AND p.mode = 'album'
  `);

  const row = statsResult.rows[0] as any;
  if (!row) return null;

  const wins = Number(row.wins);
  const totalPlayed = Number(row.total_played);
  const winRate = totalPlayed > 0 ? wins / totalPlayed : 0;
  const avgScore = Number(row.avg_score);

  const t = ALBUM_ARCHIVIST_THRESHOLDS;
  if (wins < t.albumWins || winRate < t.winRate || avgScore < t.avgScore) {
    return null;
  }

  const artist = await db
    .select({ name: artists.name })
    .from(artists)
    .where(eq(artists.id, artistId))
    .then((rows) => rows[0]);

  if (!artist) return null;

  const titleName = `${artist.name} Archivist`;

  const titleId = await findOrCreateTitle({
    name: titleName,
    titleType: "depth_album",
    artistId,
    description: `Album-level knowledge of ${artist.name}`,
  });

  const granted = await grantTitleToPlayer(playerId, titleId);
  return granted ? titleName : null;
}

// =============================================================
// DEPTH — ERA PURIST
// =============================================================

async function checkEraPurist(
  playerId: string,
  artistId: string,
  puzzleTags: string[],
  puzzleId: string
): Promise<string | null> {
  const hasScholar = await db.execute(sql`
    SELECT 1 FROM player_titles pt
    JOIN titles t ON pt.title_id = t.id
    WHERE pt.player_id = ${playerId}
    AND t.title_type = 'depth_artist'
    AND t.artist_id = ${artistId}
    LIMIT 1
  `);
  if (hasScholar.rows.length === 0) return null;

  const decadeTags = puzzleTags.filter((t) => /^\d{2,4}s$/.test(t));
  if (decadeTags.length === 0) return null;

  const artist = await db
    .select({ name: artists.name })
    .from(artists)
    .where(eq(artists.id, artistId))
    .then((rows) => rows[0]);
  if (!artist) return null;

  for (const decade of decadeTags) {
    const existing = await db.execute(sql`
      SELECT 1 FROM player_titles pt
      JOIN titles t ON pt.title_id = t.id
      WHERE pt.player_id = ${playerId}
      AND t.title_type = 'era_purist'
      AND t.artist_id = ${artistId}
      AND t.genre = ${decade}
      LIMIT 1
    `);
    if (existing.rows.length > 0) continue;

    const decadeLevel = await getPlayerGenreLevel(playerId, decade);
    if (decadeLevel < ERA_PURIST_THRESHOLDS.decadeGenreLevel) continue;

    const decadeCount = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM player_puzzle_history pph
      JOIN puzzles p ON pph.puzzle_id = p.id
      WHERE pph.player_id = ${playerId}
      AND ${decade} = ANY(p.tags)
    `);
    const total = Number((decadeCount.rows[0] as any)?.total || 0);
    if (total < ERA_PURIST_THRESHOLDS.totalDecadePuzzles) continue;

    const titleName = `${genreDisplayName(decade)} ${artist.name} Purist`;

    const titleId = await findOrCreateTitle({
      name: titleName,
      titleType: "era_purist",
      genre: decade,
      artistId,
      description: `${artist.name} expertise rooted in the ${genreDisplayName(decade)}`,
    });

    const granted = await grantTitleToPlayer(playerId, titleId);
    if (granted) return titleName;
  }

  return null;
}

// =============================================================
// TIER 2 — FUSION (Two Genres at Scholar+)
// =============================================================

async function checkFusionTitles(
  playerId: string,
  puzzleId: string
): Promise<string[]> {
  const newTitles: string[] = [];

  const scholarGenres = await getGenresAtLevel(playerId, 3);
  if (scholarGenres.length < 2) return [];

  const allGenreWins = await getGenreWinCounts(playerId);

  for (let i = 0; i < scholarGenres.length; i++) {
    for (let j = i + 1; j < scholarGenres.length; j++) {
      const genreA = scholarGenres[i];
      const genreB = scholarGenres[j];

      const combinedWins = (allGenreWins[genreA] || 0) + (allGenreWins[genreB] || 0);
      if (combinedWins < 50) continue;

      const [sortedA, sortedB] = [genreA, genreB].sort();
      const existing = await db.execute(sql`
        SELECT 1 FROM player_titles pt
        JOIN titles t ON pt.title_id = t.id
        WHERE pt.player_id = ${playerId}
        AND t.title_type = 'fusion'
        AND t.genre_a = ${sortedA}
        AND t.genre_b = ${sortedB}
        LIMIT 1
      `);
      if (existing.rows.length > 0) continue;

      const titleName = getFusionTitle(genreA, genreB);

      const titleId = await findOrCreateTitle({
        name: titleName,
        titleType: "fusion",
        genreA: sortedA,
        genreB: sortedB,
        description: `${genreDisplayName(genreA)} meets ${genreDisplayName(genreB)}`,
      });

      const granted = await grantTitleToPlayer(playerId, titleId);
      if (granted) newTitles.push(titleName);
    }
  }

  return newTitles;
}

// =============================================================
// TIER 3 — CONVERGENCE (Three Genres at Scholar+)
// =============================================================

async function checkConvergenceTitles(
  playerId: string,
  puzzleId: string
): Promise<string[]> {
  const newTitles: string[] = [];

  const scholarGenres = await getGenresAtLevel(playerId, 3);
  if (scholarGenres.length < 3) return [];

  const allGenreWins = await getGenreWinCounts(playerId);

  for (let i = 0; i < scholarGenres.length; i++) {
    for (let j = i + 1; j < scholarGenres.length; j++) {
      for (let k = j + 1; k < scholarGenres.length; k++) {
        const genreA = scholarGenres[i];
        const genreB = scholarGenres[j];
        const genreC = scholarGenres[k];

        const combinedWins =
          (allGenreWins[genreA] || 0) + (allGenreWins[genreB] || 0) + (allGenreWins[genreC] || 0);
        if (combinedWins < 80) continue;

        const key = convergenceKey(genreA, genreB, genreC);
        if (!CONVERGENCE_MAP[key]) continue;

        const avgResult = await db.execute(sql`
          SELECT COALESCE(AVG(ps.score), 0)::float AS avg_score
          FROM player_puzzle_history pph
          JOIN puzzles p ON pph.puzzle_id = p.id
          LEFT JOIN player_scores ps ON ps.player_id = pph.player_id AND ps.puzzle_id = pph.puzzle_id
          WHERE pph.player_id = ${playerId}
          AND pph.solved = true
          AND (
            ${genreA} = ANY(p.tags)
            OR ${genreB} = ANY(p.tags)
            OR ${genreC} = ANY(p.tags)
          )
        `);
        const avgScore = Number((avgResult.rows[0] as any)?.avg_score || 0);
        if (avgScore < 500) continue;

        const [sortedA, sortedB, sortedC] = [genreA, genreB, genreC].sort();
        const existing = await db.execute(sql`
          SELECT 1 FROM player_titles pt
          JOIN titles t ON pt.title_id = t.id
          WHERE pt.player_id = ${playerId}
          AND t.title_type = 'convergence'
          AND t.genre_a = ${sortedA}
          AND t.genre_b = ${sortedB}
          AND t.genre_c = ${sortedC}
          LIMIT 1
        `);
        if (existing.rows.length > 0) continue;

        const titleName = CONVERGENCE_MAP[key];
        const titleId = await findOrCreateTitle({
          name: titleName,
          titleType: "convergence",
          genreA: sortedA,
          genreB: sortedB,
          genreC: sortedC,
          description: `Mastery across ${genreDisplayName(genreA)}, ${genreDisplayName(genreB)}, and ${genreDisplayName(genreC)}`,
        });

        const granted = await grantTitleToPlayer(playerId, titleId);
        if (granted) newTitles.push(titleName);
      }
    }
  }

  return newTitles;
}

// =============================================================
// TIER 4 — GLOBAL SUPREMACY (Nightly batch — NOT per-puzzle)
// Export for use in a cron job / scheduled function
// =============================================================

export async function evaluateGlobalTitles(): Promise<void> {
  const globalPositions = [
    {
      name: "The First Blood",
      description: "Most puzzle-opening correct guesses",
      query: sql`
        SELECT pph.player_id, COUNT(*)::int AS value
        FROM player_puzzle_history pph
        WHERE pph.solved = true AND pph.guessed_at_clue <= 2
        GROUP BY pph.player_id
        ORDER BY value DESC
        LIMIT 1
      `,
    },
    {
      name: "The Archivist",
      description: "Most total puzzles completed",
      query: sql`
        SELECT pph.player_id, COUNT(*)::int AS value
        FROM player_puzzle_history pph
        GROUP BY pph.player_id
        ORDER BY value DESC
        LIMIT 1
      `,
    },
    {
      name: "The Ghost",
      description: "Most wins with zero wrong guesses",
      query: sql`
        SELECT pph.player_id, COUNT(*)::int AS value
        FROM player_puzzle_history pph
        WHERE pph.solved = true AND pph.wrong_guesses = 0
        GROUP BY pph.player_id
        ORDER BY value DESC
        LIMIT 1
      `,
    },
    {
      name: "The Survivor",
      description: "Most grace period wins",
      query: sql`
        SELECT pph.player_id, COUNT(*)::int AS value
        FROM player_puzzle_history pph
        WHERE pph.grace_period_save = true
        GROUP BY pph.player_id
        ORDER BY value DESC
        LIMIT 1
      `,
    },
    {
      name: "The Completionist",
      description: "Most genres at Scholar level or higher",
      query: sql`
        SELECT pt.player_id, COUNT(DISTINCT t.genre)::int AS value
        FROM player_titles pt
        JOIN titles t ON pt.title_id = t.id
        WHERE t.title_type = 'genre' AND t.level >= 3
        GROUP BY pt.player_id
        ORDER BY value DESC
        LIMIT 1
      `,
    },
  ];

  for (const position of globalPositions) {
    try {
      const result = await db.execute(position.query);
      if (result.rows.length === 0) continue;

      const winner = result.rows[0] as any;
      const winnerId = winner.player_id as string;

      const titleId = await findOrCreateTitle({
        name: position.name,
        titleType: "global",
        description: position.description,
      });

      const currentHolder = await db.execute(sql`
        SELECT pt.player_id
        FROM player_titles pt
        WHERE pt.title_id = ${titleId}
        LIMIT 1
      `);

      const currentHolderId =
        currentHolder.rows.length > 0 ? (currentHolder.rows[0] as any).player_id : null;

      if (currentHolderId === winnerId) continue;

      if (currentHolderId) {
        await db.execute(sql`
          DELETE FROM player_titles
          WHERE player_id = ${currentHolderId} AND title_id = ${titleId}
        `);
        // TODO: Notify previous holder
        // "Your title [name] was taken on [date]."
        // Never reveal who took it.
        await updateDisplayedTitle(currentHolderId);
      }

      await grantTitleToPlayer(winnerId, titleId);
      await updateDisplayedTitle(winnerId);
    } catch (error) {
      console.error(`Error evaluating global title ${position.name}:`, error);
    }
  }
}

// =============================================================
// HELPER — Get All Genres Where Player Has Reached a Level
// =============================================================

async function getGenresAtLevel(playerId: string, minLevel: number): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT DISTINCT t.genre
    FROM player_titles pt
    JOIN titles t ON pt.title_id = t.id
    WHERE pt.player_id = ${playerId}
    AND t.title_type = 'genre'
    AND t.level >= ${minLevel}
    AND t.genre IS NOT NULL
  `);

  return result.rows.map((r: any) => r.genre as string);
}

// =============================================================
// HELPER — Get a Player's Level in a Specific Genre
// =============================================================

async function getPlayerGenreLevel(playerId: string, genre: string): Promise<number> {
  const result = await db.execute(sql`
    SELECT MAX(t.level)::int AS max_level
    FROM player_titles pt
    JOIN titles t ON pt.title_id = t.id
    WHERE pt.player_id = ${playerId}
    AND t.title_type = 'genre'
    AND t.genre = ${genre}
  `);

  return Number((result.rows[0] as any)?.max_level || 0);
}

// =============================================================
// HELPER — Get Win Counts Per Genre
// =============================================================

async function getGenreWinCounts(playerId: string): Promise<Record<string, number>> {
  const result = await db.execute(sql`
    SELECT tag, COUNT(*)::int AS wins
    FROM player_puzzle_history pph
    JOIN puzzles p ON pph.puzzle_id = p.id,
    LATERAL unnest(p.tags) AS tag
    WHERE pph.player_id = ${playerId}
    AND pph.solved = true
    GROUP BY tag
  `);

  const counts: Record<string, number> = {};
  for (const row of result.rows as any[]) {
    counts[row.tag] = Number(row.wins);
  }
  return counts;
}

// =============================================================
// HELPER — Find or Create a Title Row
// =============================================================

interface CreateTitleParams {
  name: string;
  titleType: string;
  genre?: string;
  level?: number;
  genreA?: string;
  genreB?: string;
  genreC?: string;
  artistId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

async function findOrCreateTitle(params: CreateTitleParams): Promise<string> {
  let whereClause;

  if (params.titleType === "genre" && params.genre && params.level) {
    whereClause = sql`title_type = 'genre' AND genre = ${params.genre} AND level = ${params.level}`;
  } else if (params.titleType === "fusion" && params.genreA && params.genreB) {
    whereClause = sql`title_type = 'fusion' AND genre_a = ${params.genreA} AND genre_b = ${params.genreB}`;
  } else if (params.titleType === "convergence" && params.genreA && params.genreB && params.genreC) {
    whereClause = sql`title_type = 'convergence' AND genre_a = ${params.genreA} AND genre_b = ${params.genreB} AND genre_c = ${params.genreC}`;
  } else if (
    (params.titleType === "depth_artist" || params.titleType === "depth_album" || params.titleType === "era_purist") &&
    params.artistId
  ) {
    const genreClause = params.genre
      ? sql` AND genre = ${params.genre}`
      : sql``;
    whereClause = sql`title_type = ${params.titleType} AND artist_id = ${params.artistId}${genreClause}`;
  } else if (params.titleType === "global") {
    whereClause = sql`title_type = 'global' AND name = ${params.name}`;
  } else {
    whereClause = sql`name = ${params.name} AND title_type = ${params.titleType}`;
  }

  const existing = await db.execute(
    sql`SELECT id FROM titles WHERE ${whereClause} LIMIT 1`
  );

  if (existing.rows.length > 0) {
    return (existing.rows[0] as any).id;
  }

  // Map title_type to the tier column value
  const tierMap: Record<string, number> = {
    genre: 1,
    depth_artist: 1,
    depth_album: 1,
    era_purist: 1,
    fusion: 2,
    convergence: 3,
    global: 4,
    editorial: 5,
    bestowed: 6,
  };

  const result = await db.execute(sql`
    INSERT INTO titles (name, description, tier, title_type, genre, level, genre_a, genre_b, genre_c, artist_id, metadata, is_active)
    VALUES (
      ${params.name},
      ${params.description || null},
      ${tierMap[params.titleType] || 1},
      ${params.titleType},
      ${params.genre || null},
      ${params.level || null},
      ${params.genreA || null},
      ${params.genreB || null},
      ${params.genreC || null},
      ${params.artistId || null},
      ${JSON.stringify(params.metadata || {})}::jsonb,
      true
    )
    RETURNING id
  `);

  return (result.rows[0] as any).id;
}

// =============================================================
// HELPER — Grant Title to Player (with duplicate protection)
// =============================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function grantTitleToPlayer(
  playerId: string,
  titleId: string
): Promise<boolean> {
  try {
    await db.execute(sql`
      INSERT INTO player_titles (player_id, title_id, earned_at, is_displayed)
      VALUES (${playerId}, ${titleId}, NOW(), false)
      ON CONFLICT (player_id, title_id) DO NOTHING
    `);
    return true;
  } catch (error) {
    console.error("Grant title error:", error);
    return false;
  }
}

// =============================================================
// HELPER — Update Displayed Title (Highest Tier Wins)
// =============================================================

async function updateDisplayedTitle(
  playerId: string
): Promise<{ name: string; tierPriority: number } | null> {
  const allPlayerTitles = await db.execute(sql`
    SELECT t.id, t.name, t.title_type, t.level
    FROM player_titles pt
    JOIN titles t ON pt.title_id = t.id
    WHERE pt.player_id = ${playerId}
  `);

  if (allPlayerTitles.rows.length === 0) return null;

  let bestTitle: { id: string; name: string; priority: number } | null = null;

  for (const row of allPlayerTitles.rows as any[]) {
    let priority = TIER_PRIORITY[row.title_type] || 0;

    if (row.title_type === "genre" && row.level) {
      priority += Number(row.level);
    }

    if (!bestTitle || priority > bestTitle.priority) {
      bestTitle = { id: row.id, name: row.name, priority };
    }
  }

  if (!bestTitle) return null;

  await db.execute(sql`
    UPDATE player_titles SET is_displayed = false WHERE player_id = ${playerId}
  `);

  await db.execute(sql`
    UPDATE player_titles SET is_displayed = true
    WHERE player_id = ${playerId} AND title_id = ${bestTitle.id}
  `);

  return { name: bestTitle.name, tierPriority: bestTitle.priority };
}
