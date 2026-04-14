import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { badges } from "./schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const STARTER_BADGES = [
  // One-time moments
  { name: "First Blood", description: "Won your first puzzle", triggerEvent: "first_win", rarity: "common", displayOrder: 1 },
  { name: "Deep Dive", description: "Won your first Album mode puzzle", triggerEvent: "first_album_win", rarity: "common", displayOrder: 2 },
  { name: "Clean Sweep", description: "Won a puzzle with zero wrong guesses", triggerEvent: "first_perfect", rarity: "common", displayOrder: 3 },
  { name: "Buzzer Beater", description: "Won during the grace period", triggerEvent: "first_grace_win", rarity: "uncommon", displayOrder: 4 },
  { name: "One and Done", description: "Guessed correctly on the first clue", triggerEvent: "first_clue_win", rarity: "rare", displayOrder: 5 },
  { name: "Last Breath", description: "Guessed correctly on the final clue", triggerEvent: "last_clue_win", rarity: "uncommon", displayOrder: 6 },
  { name: "Genre Hopper", description: "Played puzzles in 5 different genres", triggerEvent: "five_genres", rarity: "common", displayOrder: 7 },

  // Cumulative milestones
  { name: "Double Digits", description: "Won 10 puzzles", triggerEvent: "ten_wins", rarity: "common", displayOrder: 8 },
  { name: "Half Century", description: "Won 50 puzzles", triggerEvent: "fifty_wins", rarity: "uncommon", displayOrder: 9 },
  { name: "Centurion", description: "Won 100 puzzles", triggerEvent: "hundred_wins", rarity: "rare", displayOrder: 10 },
  { name: "Thousand Club", description: "Accumulated 10,000 total points", triggerEvent: "ten_k_points", rarity: "uncommon", displayOrder: 11 },
  { name: "High Roller", description: "Accumulated 50,000 total points", triggerEvent: "fifty_k_points", rarity: "rare", displayOrder: 12 },
  { name: "Five Alive", description: "Won 5 puzzles in a row", triggerEvent: "streak_five", rarity: "uncommon", displayOrder: 13 },
  { name: "On Fire", description: "Won 10 puzzles in a row", triggerEvent: "streak_ten", rarity: "rare", displayOrder: 14 },
  { name: "Untouchable", description: "Won 20 puzzles in a row", triggerEvent: "streak_twenty", rarity: "epic", displayOrder: 15 },

  // Behavioral quirks
  { name: "Speed Demon", description: "Scored 900+ on a puzzle", triggerEvent: "score_900", rarity: "uncommon", displayOrder: 16 },
  { name: "Maximizer", description: "Scored a perfect 1,000", triggerEvent: "score_1000", rarity: "epic", displayOrder: 17 },
  { name: "Stubborn", description: "Won after 3 or more wrong guesses", triggerEvent: "win_after_three_wrong", rarity: "uncommon", displayOrder: 18 },
  { name: "Tourist", description: "Played at least one puzzle in every available genre", triggerEvent: "all_genres", rarity: "rare", displayOrder: 19 },
  { name: "Dual Threat", description: "Won both an Artist and Album puzzle for the same artist", triggerEvent: "dual_threat", rarity: "rare", displayOrder: 20 },
];

async function seed() {
  console.log("Seeding badges...");

  for (const badge of STARTER_BADGES) {
    const [existing] = await db
      .select()
      .from(badges)
      .where(eq(badges.name, badge.name))
      .limit(1);

    if (existing) {
      console.log(`  ✓ ${badge.name} (already exists)`);
      continue;
    }

    await db.insert(badges).values(badge);
    console.log(`  + ${badge.name}`);
  }

  console.log("Done — 20 starter badges seeded.");
}

seed().catch(console.error);
