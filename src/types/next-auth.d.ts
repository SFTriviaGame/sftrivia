import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      playerProfileId?: string;
    } & DefaultSession["user"];
  }
}
