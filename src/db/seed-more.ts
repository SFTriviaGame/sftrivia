import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { artists, albums, songs, puzzles, puzzleSongs } from "./schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seedMore() {
  // ── Guns N' Roses ─────────────────────────────────────────────────────

  console.log("Seeding Guns N' Roses...");

  const [gnr] = await db
    .insert(artists)
    .values({
      name: "Guns N' Roses",
      nameNormalized: "guns n roses",
      country: "US",
      activeYears: "1985-1993, 2001-present",
      contentType: "music",
    })
    .returning();

  const [appetite] = await db.insert(albums).values({ artistId: gnr.id, name: "Appetite for Destruction", year: 1987 }).returning();
  const [lies] = await db.insert(albums).values({ artistId: gnr.id, name: "GN'R Lies", year: 1988 }).returning();
  const [illusion1] = await db.insert(albums).values({ artistId: gnr.id, name: "Use Your Illusion I", year: 1991 }).returning();
  const [illusion2] = await db.insert(albums).values({ artistId: gnr.id, name: "Use Your Illusion II", year: 1991 }).returning();

  const gnrSongs = [
    { name: "Think About You", albumId: appetite.id, popularity: 12 },
    { name: "My Michelle", albumId: appetite.id, popularity: 20 },
    { name: "Out Ta Get Me", albumId: appetite.id, popularity: 25 },
    { name: "Used to Love Her", albumId: lies.id, popularity: 32 },
    { name: "Nightrain", albumId: appetite.id, popularity: 40 },
    { name: "14 Years", albumId: illusion2.id, popularity: 45 },
    { name: "Don't Cry", albumId: illusion1.id, popularity: 55 },
    { name: "Patience", albumId: lies.id, popularity: 62 },
    { name: "November Rain", albumId: illusion1.id, popularity: 72 },
    { name: "Welcome to the Jungle", albumId: appetite.id, popularity: 82 },
    { name: "Paradise City", albumId: appetite.id, popularity: 88 },
    { name: "Sweet Child O' Mine", albumId: appetite.id, popularity: 96 },
  ];

  const gnrCreated = [];
  for (const s of gnrSongs) {
    const [song] = await db.insert(songs).values({ name: s.name, artistId: gnr.id, albumId: s.albumId, popularity: s.popularity }).returning();
    gnrCreated.push(song);
  }

  const [gnrPuzzle] = await db.insert(puzzles).values({
    mode: "artist", contentType: "music", artistId: gnr.id,
    primaryGenre: "hard rock", qualityScore: 92, published: true,
    approvedBy: "seed", approvedAt: new Date(),
  }).returning();

  for (let i = 0; i < gnrCreated.length; i++) {
    await db.insert(puzzleSongs).values({ puzzleId: gnrPuzzle.id, songId: gnrCreated[i].id, displayOrder: i + 1 });
  }

  console.log(`Created Guns N' Roses puzzle: ${gnrPuzzle.id}`);

  // ── Def Leppard ───────────────────────────────────────────────────────

  console.log("Seeding Def Leppard...");

  const [dl] = await db
    .insert(artists)
    .values({
      name: "Def Leppard",
      nameNormalized: "def leppard",
      country: "UK",
      activeYears: "1977-present",
      contentType: "music",
    })
    .returning();

  const [pyromania] = await db.insert(albums).values({ artistId: dl.id, name: "Pyromania", year: 1983 }).returning();
  const [hysteria] = await db.insert(albums).values({ artistId: dl.id, name: "Hysteria", year: 1987 }).returning();
  const [highDry] = await db.insert(albums).values({ artistId: dl.id, name: "High 'n' Dry", year: 1981 }).returning();
  const [adrenalize] = await db.insert(albums).values({ artistId: dl.id, name: "Adrenalize", year: 1992 }).returning();

  const dlSongs = [
    { name: "Die Hard the Hunter", albumId: pyromania.id, popularity: 10 },
    { name: "Stagefright", albumId: pyromania.id, popularity: 18 },
    { name: "Gods of War", albumId: hysteria.id, popularity: 24 },
    { name: "Bringin' On the Heartbreak", albumId: highDry.id, popularity: 35 },
    { name: "Let's Get Rocked", albumId: adrenalize.id, popularity: 42 },
    { name: "Armageddon It", albumId: hysteria.id, popularity: 50 },
    { name: "Love Bites", albumId: hysteria.id, popularity: 58 },
    { name: "Rock of Ages", albumId: pyromania.id, popularity: 65 },
    { name: "Hysteria", albumId: hysteria.id, popularity: 72 },
    { name: "Animal", albumId: hysteria.id, popularity: 78 },
    { name: "Photograph", albumId: pyromania.id, popularity: 86 },
    { name: "Pour Some Sugar on Me", albumId: hysteria.id, popularity: 95 },
  ];

  const dlCreated = [];
  for (const s of dlSongs) {
    const [song] = await db.insert(songs).values({ name: s.name, artistId: dl.id, albumId: s.albumId, popularity: s.popularity }).returning();
    dlCreated.push(song);
  }

  const [dlPuzzle] = await db.insert(puzzles).values({
    mode: "artist", contentType: "music", artistId: dl.id,
    primaryGenre: "hair metal", qualityScore: 90, published: true,
    approvedBy: "seed", approvedAt: new Date(),
  }).returning();

  for (let i = 0; i < dlCreated.length; i++) {
    await db.insert(puzzleSongs).values({ puzzleId: dlPuzzle.id, songId: dlCreated[i].id, displayOrder: i + 1 });
  }

  console.log(`Created Def Leppard puzzle: ${dlPuzzle.id}`);
  console.log("\nDone! 2 new puzzles added.");
}

seedMore().catch(console.error);
