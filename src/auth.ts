import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  users,
  accounts,
  authSessions,
  verificationTokens,
  playerProfiles,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: authSessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    Resend({
      from: process.env.AUTH_EMAIL_FROM || "onboarding@resend.dev",
    }),
  ],

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },

  callbacks: {
    async session({ session, user }) {
      if (user?.email) {
        const [profile] = await db
          .select({ id: playerProfiles.id })
          .from(playerProfiles)
          .where(eq(playerProfiles.email, user.email))
          .limit(1);

        if (profile) {
          session.user.playerProfileId = profile.id;
        }
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      if (user.email) {
        const [existing] = await db
          .select({ id: playerProfiles.id })
          .from(playerProfiles)
          .where(eq(playerProfiles.email, user.email))
          .limit(1);

        if (!existing) {
          await db.insert(playerProfiles).values({
            email: user.email,
            displayName: user.name || null,
          });
        }
      }
    },
  },
});
