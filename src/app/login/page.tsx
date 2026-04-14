"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Enter your email to continue.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("resend", {
        email: email.trim().toLowerCase(),
        redirect: false,
        callbackUrl: "/play",
      });

      if (result?.error) {
        setError("Something went wrong. Try again.");
        setIsLoading(false);
      } else {
        window.location.href = "/login/check-email";
      }
    } catch {
     setError("Something went wrong. Try again.");
     setIsLoading(false);
   }
  }

  return (
    <main
      id="main-content"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        backgroundColor: "#FAFAF8",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "2.5rem",
            color: "#252018",
            marginBottom: "0.5rem",
            fontWeight: 400,
          }}
        >
          Deep Cut
        </h1>
        <p
          style={{
            color: "#737373",
            fontSize: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          Sign in to save your scores, earn titles, and track your streak.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <label
            htmlFor="email"
            style={{
              textAlign: "left",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#252018",
            }}
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              fontSize: "1rem",
              border: "1.5px solid #d4d0cb",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#252018",
              outline: "none",
              fontFamily: "'DM Sans', sans-serif",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <p
              role="alert"
              style={{
                color: "#dc2626",
                fontSize: "0.875rem",
                margin: 0,
                textAlign: "left",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.875rem",
              fontSize: "1rem",
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              backgroundColor: isLoading ? "#d4a574" : "#b45309",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            aria-label={isLoading ? "Sending magic link..." : "Send magic link"}
          >
            {isLoading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>

        <p
          style={{
            color: "#8a8580",
            fontSize: "0.8125rem",
            marginTop: "2rem",
            lineHeight: 1.5,
          }}
        >
          No password needed. We&apos;ll send you a link to sign in.
        </p>

<a
          href="/play"
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            color: "#b45309",
            fontSize: "0.875rem",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          &larr; Back to game
        </a>
      </div>
    </main>
  );
}
