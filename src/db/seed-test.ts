import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { artists, albums, songs, puzzles, puzzleSongs } from "./schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seedTestPuzzle() {
  console.log("Seeding test puzzle data...");

  // 1. Create artist
  const [artist] = await db
    .insert(artists)
    .values({
      name: "Mötley Crüe",
      nameNormalized: "motley crue",
      country: "US",
      activeYears: "1981-2015, 2019-present",
      contentType: "music",
    })
    .onConflictDoNothing()
    .returning();

  if (!artist) {
    console.log("Artist already exists, skipping...");
    return;
  }

  console.log(`Created artist: ${artist.name} (${artist.id})`);

  // 2. Create albums
  const [shout] = await db
    .insert(albums)
    .values({
      artistId: artist.id,
      name: "Shout at the Devil",
      nameNormalized: "shout at the devil",
      year: 1983,
    })
    .returning();

  const [theatre] = await db
    .insert(albums)
    .values({
      artistId: artist.id,
      name: "Theatre of Pain",
      nameNormalized: "theatre of pain",
      year: 1985,
    })
    .returning();

  const [girls] = await db
    .insert(albums)
    .values({
      artistId: artist.id,
      name: "Girls, Girls, Girls",
      nameNormalized: "girls girls girls",
      year: 1987,
    })
    .returning();

  const [feelgood] = await db
    .insert(albums)
    .values({
      artistId: artist.id,
      name: "Dr. Feelgood",
      nameNormalized: "dr feelgood",
      year: 1989,
    })
    .returning();

  const [tooFast] = await db
    .insert(albums)
    .values({
      artistId: artist.id,
      name: "Too Fast for Love",
      nameNormalized: "too fast for love",
      year: 1981,
    })
    .returning();

  console.log("Created albums");

  // 3. Create songs — ordered by popularity (1 = most obscure, higher = more popular)
  const songData = [
    { name: "Ten Seconds to Love", albumId: shout.id, popularity: 15 },
    { name: "Too Young to Fall in Love", albumId: shout.id, popularity: 25 },
    { name: "Looks That Kill", albumId: shout.id, popularity: 35 },
    { name: "Wild Side", albumId: girls.id, popularity: 42 },
    { name: "Same Ol' Situation", albumId: feelgood.id, popularity: 48 },
    { name: "Smokin' in the Boys Room", albumId: theatre.id, popularity: 55 },
    { name: "Live Wire", albumId: tooFast.id, popularity: 58 },
    { name: "Shout at the Devil", albumId: shout.id, popularity: 65 },
    { name: "Home Sweet Home", albumId: theatre.id, popularity: 72 },
    { name: "Dr. Feelgood", albumId: feelgood.id, popularity: 78 },
    { name: "Girls, Girls, Girls", albumId: girls.id, popularity: 85 },
    { name: "Kickstart My Heart", albumId: feelgood.id, popularity: 95 },
  ];

  const createdSongs = [];
  for (const s of songData) {
    const [song] = await db
      .insert(songs)
      .values({
        name: s.name,
        artistId: artist.id,
        albumId: s.albumId,
        popularity: s.popularity,
      })
      .returning();
    createdSongs.push(song);
  }

  console.log(`Created ${createdSongs.length} songs`);

  // 4. Create puzzle
  const [puzzle] = await db
    .insert(puzzles)
    .values({
      mode: "artist",
      contentType: "music",
      artistId: artist.id,
      primaryGenre: "hair metal",
      qualityScore: 90,
      published: true,
      approvedBy: "seed",
      approvedAt: new Date(),
    })
    .returning();

  console.log(`Created puzzle: ${puzzle.id}`);

  // 5. Link songs to puzzle in reveal order (1 = most obscure)
  for (let i = 0; i < createdSongs.length; i++) {
    await db.insert(puzzleSongs).values({
      puzzleId: puzzle.id,
      songId: createdSongs[i].id,
      displayOrder: i + 1,
    });
  }

  console.log(`Linked ${createdSongs.length} songs to puzzle`);
  console.log("\nTest puzzle ready! Puzzle ID:", puzzle.id);
}

seedTestPuzzle().catch(console.error);
