import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { gameConfig } from "./schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const seedData = [
  { key: "reveal_interval_seconds", value: "2" },
  { key: "timer_seconds", value: "30" },
  { key: "grace_seconds", value: "5" },
  { key: "wrong_guess_penalty", value: "50" },
  { key: "score_max", value: "1000" },
  { key: "score_floor", value: "50" },
  { key: "max_clues", value: "15" },
  { key: "score_decay_model", value: "linear" },
  { key: "site_status", value: "ok" },
  { key: "site_status_msg", value: "" },
  { key: "puzzle_buffer_warning_days", value: "30" },
  { key: "puzzle_buffer_critical_days", value: "14" },
  { key: "feedback_enabled", value: "false" },
  { key: "feedback_show_crowd", value: "false" },
  { key: "feedback_min_votes_weighted", value: "50" },
  { key: "self_serve_deletion", value: "false" },
  { key: "deletion_grace_days", value: "30" },
  { key: "session_secret_version", value: "1" },
  { key: "day_pass_session_ttl_minutes", value: "60" },
  { key: "titles_enabled", value: "false" },
  { key: "badges_enabled", value: "false" },
  { key: "streaks_enabled", value: "false" },
  { key: "challenges_enabled", value: "false" },
  { key: "gauntlet_enabled", value: "false" },
];

async function seed() {
  console.log("Seeding game_config...");
  for (const row of seedData) {
    await db
      .insert(gameConfig)
      .values(row)
      .onConflictDoNothing({ target: gameConfig.key });
  }
  console.log(`Seeded ${seedData.length} config entries.`);
}

seed().catch(console.error);
