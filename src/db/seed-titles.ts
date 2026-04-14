// =============================================================
// DEEP CUT — Seed Titles
// src/db/seed-titles.ts
//
// Pre-populates the titles table with all T1 Genre Mastery titles
// for every genre currently in the system.
//
// Run: npx tsx src/db/seed-titles.ts
// =============================================================

import { db } from "./index";
import { sql } from "drizzle-orm";

// Every genre currently in the system (slug → display name)
const GENRES: Record<string, string> = {
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
  indie: "Indie",
  "60s": "60s",
  "70s": "70s",
  "80s": "80s",
  "90s": "90s",
  "2000s": "2000s",
  "2010s": "2010s",
};

const LEVELS = [
  { level: 1, name: "Initiate", description: "The game sees you." },
  { level: 2, name: "Student", description: "You're paying attention." },
  { level: 3, name: "Scholar", description: "You know things most people don't." },
  { level: 4, name: "Master", description: "This is your genre." },
  { level: 5, name: "Legend", description: "There's nothing left to prove." },
];

async function seedTitles() {
  console.log("Seeding T1 Genre Mastery titles...");

  let created = 0;
  let skipped = 0;

  for (const [slug, displayName] of Object.entries(GENRES)) {
    for (const level of LEVELS) {
      const titleName = `${displayName} ${level.name}`;

      // Check if already exists
      const existing = await db.execute(
        sql`SELECT id FROM titles WHERE title_type = 'genre' AND genre = ${slug} AND level = ${level.level} LIMIT 1`
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      await db.execute(sql`
        INSERT INTO titles (name, description, tier, title_type, genre, level, is_active, metadata)
        VALUES (
          ${titleName},
          ${level.description},
          1,
          'genre',
          ${slug},
          ${level.level},
          true,
          '{}'::jsonb
        )
      `);

      created++;
    }
  }

  console.log(`Done. Created ${created} titles, skipped ${skipped} (already exist).`);
  console.log(`Total T1 titles: ${Object.keys(GENRES).length * LEVELS.length}`);
  process.exit(0);
}

seedTitles().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
