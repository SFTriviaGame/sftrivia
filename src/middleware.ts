import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// ── Simple sliding-window rate limiter ──────────────────────────────────────
// In-memory — resets on cold start. Fine for MVP abuse prevention.
// For production: replace with Upstash Redis (@upstash/ratelimit)
//   npm install @upstash/ratelimit @upstash/redis
//   See: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // per window per IP
const hits = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): { limited: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, remaining: MAX_REQUESTS - 1 };
  }
  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return { limited: true, remaining: 0 };
  }
  return { limited: false, remaining: MAX_REQUESTS - entry.count };
}
// Clean up stale entries periodically (prevents memory leak in long-running instances)
setInterval(() => {
  const now = Date.now();
  hits.forEach((entry, ip) => {
    if (now > entry.resetAt) hits.delete(ip);
  });
}, 60_000);
// ── Middleware ───────────────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  // Only rate-limit API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  // Don't rate-limit health checks
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const { limited, remaining } = isRateLimited(ip);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}
export const config = {
  matcher: "/api/:path*",
};
