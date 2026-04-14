"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;

  if (session?.user) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/play" })}
        style={{
          background: "none",
          border: "none",
          color: "#b45309",
          fontSize: "0.875rem",
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          padding: "0.25rem 0",
        }}
        aria-label="Sign out"
      >
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push("/login")}
      style={{
        background: "none",
        border: "none",
        color: "#b45309",
        fontSize: "0.875rem",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        padding: "0.25rem 0",
      }}
      aria-label="Sign in"
    >
      Sign In
    </button>
  );
}
