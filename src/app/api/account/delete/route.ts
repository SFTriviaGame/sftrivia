import { auth } from "@/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// DELETE /api/account/delete
// Permanently deletes all player data. Auth-gated.
// Logs the deletion in deletion_log for compliance.

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.playerProfileId || !session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const playerId = session.user.playerProfileId;
  const email = session.user.email;

  try {
    // Hash email for deletion log (simple hash — not cryptographic, just for audit)
    const emailHash = await hashEmail(email);

    // Delete in order of foreign key dependencies
    // 1. Player badges
    await db.execute(sql`DELETE FROM player_badges WHERE player_id = ${playerId}`);

    // 2. Player titles
    await db.execute(sql`DELETE FROM player_titles WHERE player_id = ${playerId}`);

    // 3. Player scores
    await db.execute(sql`DELETE FROM player_scores WHERE player_id = ${playerId}`);

    // 4. Player puzzle history
    await db.execute(sql`DELETE FROM player_puzzle_history WHERE player_id = ${playerId}`);

    // 5. Streaks
    await db.execute(sql`DELETE FROM streaks WHERE player_id = ${playerId}`);

    // 6. Song popularity votes
    await db.execute(sql`DELETE FROM song_popularity_votes WHERE player_id = ${playerId}`);

    // 7. Challenges (both sent and received)
    await db.execute(sql`DELETE FROM challenges WHERE challenger_id = ${playerId} OR challenged_id = ${playerId}`);

    // 8. Auth sessions (force sign out)
    await db.execute(sql`
      DELETE FROM session WHERE "userId" IN (
        SELECT id FROM "user" WHERE email = ${email}
      )
    `);

    // 9. Auth accounts
    await db.execute(sql`
      DELETE FROM account WHERE "userId" IN (
        SELECT id FROM "user" WHERE email = ${email}
      )
    `);

    // 10. Player profile
    await db.execute(sql`DELETE FROM player_profiles WHERE id = ${playerId}`);

    // 11. Auth user
    await db.execute(sql`DELETE FROM "user" WHERE email = ${email}`);

    // 12. Log the deletion
    await db.execute(sql`
      INSERT INTO deletion_log (email_hash, requested_at, actioned_at, method)
      VALUES (${emailHash}, NOW(), NOW(), 'self-service')
    `);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Account deletion error:", err);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}

// Simple hash for audit log — not for security
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
