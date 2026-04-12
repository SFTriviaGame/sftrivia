// src/lib/env.ts
// Import this in any server-side code to get validated env vars.
// Fails fast at startup instead of cryptic runtime errors.

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Make sure it's set in .env.local (dev) or your Vercel project settings (prod).`
    );
  }
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
} as const;
