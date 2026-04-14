// =============================================================
// DEEP CUT — Seed Soundtracks
// src/db/seed-soundtracks.ts
//
// Seeds 8 film soundtrack puzzles for testing soundtrack mode.
// Each film has 7-12 songs, sorted by popularity (deep cuts first).
//
// Run: npx tsx src/db/seed-soundtracks.ts
// =============================================================

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

interface SoundtrackSeed {
  film: {
    title: string;
    titleNormalized: string;
    tmdbFilmId: number;
    year: number;
    director?: string;
    productionCompany?: string;
  };
  tags: string[];
  primaryGenre: string;
  songs: {
    name: string;
    artistName: string;
    artistNormalized: string;
    popularity: number; // higher = more popular, revealed later
  }[];
}

const SOUNDTRACKS: SoundtrackSeed[] = [
  {
    film: {
      title: "Pulp Fiction",
      titleNormalized: "pulp fiction",
      tmdbFilmId: 680,
      year: 1994,
      director: "Quentin Tarantino",
      productionCompany: "Miramax",
    },
    tags: ["90s", "classic-soundtrack"],
    primaryGenre: "classic-soundtrack",
    songs: [
      { name: "Jungle Boogie", artistName: "Kool & The Gang", artistNormalized: "kool and the gang", popularity: 45 },
      { name: "Let's Stay Together", artistName: "Al Green", artistNormalized: "al green", popularity: 60 },
      { name: "Bustin' Surfboards", artistName: "The Tornadoes", artistNormalized: "the tornadoes", popularity: 15 },
      { name: "Lonesome Town", artistName: "Ricky Nelson", artistNormalized: "ricky nelson", popularity: 25 },
      { name: "Son of a Preacher Man", artistName: "Dusty Springfield", artistNormalized: "dusty springfield", popularity: 55 },
      { name: "Flowers on the Wall", artistName: "The Statler Brothers", artistNormalized: "the statler brothers", popularity: 30 },
      { name: "Girl, You'll Be a Woman Soon", artistName: "Urge Overkill", artistNormalized: "urge overkill", popularity: 50 },
      { name: "You Never Can Tell", artistName: "Chuck Berry", artistNormalized: "chuck berry", popularity: 65 },
      { name: "Misirlou", artistName: "Dick Dale", artistNormalized: "dick dale", popularity: 70 },
    ],
  },
  {
    film: {
      title: "Guardians of the Galaxy",
      titleNormalized: "guardians of the galaxy",
      tmdbFilmId: 118340,
      year: 2014,
      director: "James Gunn",
      productionCompany: "Marvel Studios",
    },
    tags: ["2010s", "classic-soundtrack"],
    primaryGenre: "classic-soundtrack",
    songs: [
      { name: "I'm Not in Love", artistName: "10cc", artistNormalized: "10cc", popularity: 40 },
      { name: "Moonage Daydream", artistName: "David Bowie", artistNormalized: "david bowie", popularity: 45 },
      { name: "Fooled Around and Fell in Love", artistName: "Elvin Bishop", artistNormalized: "elvin bishop", popularity: 35 },
      { name: "Escape (The Piña Colada Song)", artistName: "Rupert Holmes", artistNormalized: "rupert holmes", popularity: 50 },
      { name: "I Want You Back", artistName: "The Jackson 5", artistNormalized: "the jackson 5", popularity: 55 },
      { name: "O-o-h Child", artistName: "Five Stairsteps", artistNormalized: "five stairsteps", popularity: 42 },
      { name: "Spirit in the Sky", artistName: "Norman Greenbaum", artistNormalized: "norman greenbaum", popularity: 48 },
      { name: "Cherry Bomb", artistName: "The Runaways", artistNormalized: "the runaways", popularity: 38 },
      { name: "Come and Get Your Love", artistName: "Redbone", artistNormalized: "redbone", popularity: 58 },
      { name: "Hooked on a Feeling", artistName: "Blue Swede", artistNormalized: "blue swede", popularity: 65 },
    ],
  },
  {
    film: {
      title: "Dirty Dancing",
      titleNormalized: "dirty dancing",
      tmdbFilmId: 4951,
      year: 1987,
      director: "Emile Ardolino",
    },
    tags: ["80s", "classic-soundtrack"],
    primaryGenre: "classic-soundtrack",
    songs: [
      { name: "Overload", artistName: "Alfie Zappacosta", artistNormalized: "alfie zappacosta", popularity: 10 },
      { name: "Hey! Baby", artistName: "Bruce Channel", artistNormalized: "bruce channel", popularity: 30 },
      { name: "Stay", artistName: "Maurice Williams and the Zodiacs", artistNormalized: "maurice williams and the zodiacs", popularity: 35 },
      { name: "Yes", artistName: "Merry Clayton", artistNormalized: "merry clayton", popularity: 15 },
      { name: "Hungry Eyes", artistName: "Eric Carmen", artistNormalized: "eric carmen", popularity: 55 },
      { name: "She's Like the Wind", artistName: "Patrick Swayze", artistNormalized: "patrick swayze", popularity: 60 },
      { name: "Be My Baby", artistName: "The Ronettes", artistNormalized: "the ronettes", popularity: 50 },
      { name: "(I've Had) The Time of My Life", artistName: "Bill Medley & Jennifer Warnes", artistNormalized: "bill medley and jennifer warnes", popularity: 80 },
    ],
  },
  {
    film: {
      title: "Top Gun",
      titleNormalized: "top gun",
      tmdbFilmId: 744,
      year: 1986,
      director: "Tony Scott",
      productionCompany: "Paramount",
    },
    tags: ["80s", "classic-soundtrack"],
    primaryGenre: "classic-soundtrack",
    songs: [
      { name: "Lead Me On", artistName: "Teena Marie", artistNormalized: "teena marie", popularity: 15 },
      { name: "Hot Summer Nights", artistName: "Miami Sound Machine", artistNormalized: "miami sound machine", popularity: 20 },
      { name: "Playing with the Boys", artistName: "Kenny Loggins", artistNormalized: "kenny loggins", popularity: 30 },
      { name: "Mighty Wings", artistName: "Cheap Trick", artistNormalized: "cheap trick", popularity: 25 },
      { name: "Through the Fire", artistName: "Larry Greene", artistNormalized: "larry greene", popularity: 10 },
      { name: "Take My Breath Away", artistName: "Berlin", artistNormalized: "berlin", popularity: 65 },
      { name: "Danger Zone", artistName: "Kenny Loggins", artistNormalized: "kenny loggins", popularity: 75 },
    ],
  },
  {
    film: {
      title: "Footloose",
      titleNormalized: "footloose",
      tmdbFilmId: 1788,
      year: 1984,
      director: "Herbert Ross",
      productionCompany: "Paramount",
    },
    tags: ["80s", "classic-soundtrack"],
    primaryGenre: "classic-soundtrack",
    songs: [
      { name: "Somebody's Eyes", artistName: "Karla Bonoff", artistNormalized: "karla bonoff", popularity: 12 },
      { name: "The Girl Gets Around", artistName: "Sammy Hagar", artistNormalized: "sammy hagar", popularity: 18 },
      { name: "Never", artistName: "Moving Pictures", artistNormalized: "moving pictures", popularity: 20 },
      { name: "Dancing in the Sheets", artistName: "Shalamar", artistNormalized: "shalamar", popularity: 30 },
      { name: "Holding Out for a Hero", artistName: "Bonnie Tyler", artistNormalized: "bonnie tyler", popularity: 55 },
      { name: "Almost Paradise", artistName: "Mike Reno & Ann Wilson", artistNormalized: "mike reno and ann wilson", popularity: 45 },
      { name: "Let's Hear It for the Boy", artistName: "Deniece Williams", artistNormalized: "deniece williams", popularity: 50 },
      { name: "Footloose", artistName: "Kenny Loggins", artistNormalized: "kenny loggins", popularity: 75 },
    ],
  },
  {
    film: {
      title: "Saturday Night Fever",
      titleNormalized: "saturday night fever",
      tmdbFilmId: 11009,
      year: 1977,
      director: "John Badham",
      productionCompany: "Paramount",
    },
    tags: ["70s", "classic-soundtrack"],
    primaryGenre: "classic-soundtrack",
    songs: [
      { name: "Calypso Breakdown", artistName: "Ralph MacDonald", artistNormalized: "ralph macdonald", popularity: 10 },
      { name: "Manhattan Skyline", artistName: "David Shire", artistNormalized: "david shire", popularity: 12 },
      { name: "Boogie Shoes", artistName: "KC and the Sunshine Band", artistNormalized: "kc and the sunshine band", popularity: 35 },
      { name: "Disco Inferno", artistName: "The Trammps", artistNormalized: "the trammps", popularity: 45 },
      { name: "If I Can't Have You", artistName: "Yvonne Elliman", artistNormalized: "yvonne elliman", popularity: 40 },
      { name: "More Than a Woman", artistName: "Bee Gees", artistNormalized: "bee gees", popularity: 55 },
      { name: "How Deep Is Your Love", artistName: "Bee Gees", artistNormalized: "bee gees", popularity: 65 },
      { name: "Night Fever", artistName: "Bee Gees", artistNormalized: "bee gees", popularity: 70 },
      { name: "Stayin' Alive", artistName: "Bee Gees", artistNormalized: "bee gees", popularity: 80 },
    ],
  },
  {
    film: {
      title: "The Breakfast Club",
      titleNormalized: "the breakfast club",
      tmdbFilmId: 2108,
      year: 1985,
      director: "John Hughes",
    },
    tags: ["80s", "classic-soundtrack"],
    primaryGenre: "classic-soundtrack",
    songs: [
      { name: "Heart Too Hot to Hold", artistName: "Jesse Johnson & Stephanie Spruill", artistNormalized: "jesse johnson and stephanie spruill", popularity: 8 },
      { name: "Waiting", artistName: "Elizabeth Daily", artistNormalized: "elizabeth daily", popularity: 10 },
      { name: "Fire in the Twilight", artistName: "Wang Chung", artistNormalized: "wang chung", popularity: 18 },
      { name: "Dream Montage", artistName: "Gary Chang", artistNormalized: "gary chang", popularity: 5 },
      { name: "We Are Not Alone", artistName: "Karla DeVito", artistNormalized: "karla devito", popularity: 22 },
      { name: "Don't You (Forget About Me)", artistName: "Simple Minds", artistNormalized: "simple minds", popularity: 80 },
    ],
  },
  {
    film: {
      title: "The Big Lebowski",
      titleNormalized: "the big lebowski",
      tmdbFilmId: 115,
      year: 1998,
      director: "Joel Coen",
    },
    tags: ["90s", "classic-soundtrack"],
    primaryGenre: "classic-soundtrack",
    songs: [
      { name: "My Mood Swings", artistName: "Elvis Costello", artistNormalized: "elvis costello", popularity: 12 },
      { name: "Mucha Muchacha", artistName: "Esquivel", artistNormalized: "esquivel", popularity: 8 },
      { name: "Lujon", artistName: "Henry Mancini", artistNormalized: "henry mancini", popularity: 15 },
      { name: "Tammy", artistName: "Debbie Reynolds", artistNormalized: "debbie reynolds", popularity: 20 },
      { name: "Dead Flowers", artistName: "Townes Van Zandt", artistNormalized: "townes van zandt", popularity: 25 },
      { name: "Lookin' Out My Back Door", artistName: "Creedence Clearwater Revival", artistNormalized: "creedence clearwater revival", popularity: 40 },
      { name: "Hotel California", artistName: "Gipsy Kings", artistNormalized: "gipsy kings", popularity: 35 },
      { name: "Just Dropped In (To See What Condition My Condition Was In)", artistName: "Kenny Rogers & The First Edition", artistNormalized: "kenny rogers and the first edition", popularity: 45 },
      { name: "The Man in Me", artistName: "Bob Dylan", artistNormalized: "bob dylan", popularity: 50 },
    ],
  },
];

async function seedSoundtracks() {
  console.log("Seeding soundtrack puzzles...");

  let filmsCreated = 0;
  let artistsCreated = 0;
  let songsCreated = 0;
  let puzzlesCreated = 0;

  for (const st of SOUNDTRACKS) {
    // 1. Check if film already exists
    const existingFilm = await db.execute(
      sql`SELECT id FROM films WHERE tmdb_film_id = ${st.film.tmdbFilmId} LIMIT 1`
    );

    let filmId: string;

    if (existingFilm.rows.length > 0) {
      filmId = (existingFilm.rows[0] as any).id;
      console.log(`  Film exists: ${st.film.title}`);
    } else {
      const filmResult = await db.execute(sql`
        INSERT INTO films (title, title_normalized, tmdb_film_id, year, director, production_company)
        VALUES (
          ${st.film.title},
          ${st.film.titleNormalized},
          ${st.film.tmdbFilmId},
          ${st.film.year},
          ${st.film.director || null},
          ${st.film.productionCompany || null}
        )
        RETURNING id
      `);
      filmId = (filmResult.rows[0] as any).id;
      filmsCreated++;
      console.log(`  Created film: ${st.film.title}`);
    }

    // 2. Check if puzzle already exists for this film
    const existingPuzzle = await db.execute(
      sql`SELECT id FROM puzzles WHERE film_id = ${filmId} LIMIT 1`
    );

    if (existingPuzzle.rows.length > 0) {
      console.log(`  Puzzle exists for ${st.film.title}, skipping.`);
      continue;
    }

    // 3. Sort songs by popularity ascending (deep cuts first)
    const sortedSongs = [...st.songs].sort((a, b) => a.popularity - b.popularity);

    // 4. Create artists and songs
    const songIds: string[] = [];

    for (const song of sortedSongs) {
      // Find or create artist
      const existingArtist = await db.execute(
        sql`SELECT id FROM artists WHERE name_normalized = ${song.artistNormalized} LIMIT 1`
      );

      let artistId: string;

      if (existingArtist.rows.length > 0) {
        artistId = (existingArtist.rows[0] as any).id;
      } else {
        const artistResult = await db.execute(sql`
          INSERT INTO artists (name, name_normalized, content_type)
          VALUES (${song.artistName}, ${song.artistNormalized}, 'music')
          RETURNING id
        `);
        artistId = (artistResult.rows[0] as any).id;
        artistsCreated++;
      }

      // Create song
      const songResult = await db.execute(sql`
        INSERT INTO songs (name, artist_id, popularity)
        VALUES (${song.name}, ${artistId}, ${song.popularity})
        RETURNING id
      `);
      const songId = (songResult.rows[0] as any).id;
      songIds.push(songId);
      songsCreated++;

      // Create song-film appearance
      await db.execute(sql`
        INSERT INTO song_film_appearances (song_id, film_id, appearance_type)
        VALUES (${songId}, ${filmId}, 'soundtrack')
        ON CONFLICT DO NOTHING
      `);
    }

    // 5. Create puzzle
    const puzzleResult = await db.execute(sql`
      INSERT INTO puzzles (mode, content_type, film_id, primary_genre, tags, published)
      VALUES ('soundtrack', 'film', ${filmId}, ${st.primaryGenre}, ${sql.raw(`ARRAY[${st.tags.map(t => `'${t}'`).join(",")}]`)}, true)
      RETURNING id
    `);
    const puzzleId = (puzzleResult.rows[0] as any).id;
    puzzlesCreated++;

    // 6. Create puzzle_songs (display_order = position in sorted array)
    for (let i = 0; i < songIds.length; i++) {
      await db.execute(sql`
        INSERT INTO puzzle_songs (puzzle_id, song_id, display_order)
        VALUES (${puzzleId}, ${songIds[i]}, ${i + 1})
      `);
    }

    console.log(`  Created puzzle for ${st.film.title} (${songIds.length} songs)`);
  }

  console.log(`\nDone.`);
  console.log(`  Films: ${filmsCreated} created`);
  console.log(`  Artists: ${artistsCreated} created`);
  console.log(`  Songs: ${songsCreated} created`);
  console.log(`  Puzzles: ${puzzlesCreated} created`);
  process.exit(0);
}

seedSoundtracks().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
