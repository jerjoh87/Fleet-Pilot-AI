/**
 * Shared rate limiting for public endpoints.
 *
 * Uses Upstash Redis (via its REST API — no SDK dependency) when configured,
 * giving a durable counter shared across every serverless instance. Without
 * Upstash it falls back to a per-instance in-memory counter, which is only
 * meaningful in local dev: on Vercel each invocation may be a fresh instance,
 * so set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in production.
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function isRateLimitDurable() {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

export type RateLimitResult = {
  ok: boolean;
  /** Requests remaining in the current window (never negative). */
  remaining: number;
  /** Seconds until the window resets (best-effort). */
  resetSeconds: number;
};

// --- in-memory fallback (dev / unconfigured) -------------------------------
const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || now > entry.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1, resetSeconds: windowSec };
  }
  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return { ok: entry.count <= limit, remaining, resetSeconds: Math.ceil((entry.resetAt - now) / 1000) };
}

// --- Upstash REST (durable) ------------------------------------------------
async function upstashLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  // Atomic fixed window: INCR the key, and set its TTL on first hit.
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(windowSec), "NX"],
      ["TTL", key]
    ]),
    // Never let the limiter itself hang a request.
    cache: "no-store"
  });

  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const data = (await res.json()) as Array<{ result: number }>;
  const count = Number(data[0]?.result ?? 0);
  const ttl = Number(data[2]?.result ?? windowSec);
  const remaining = Math.max(0, limit - count);
  return { ok: count <= limit, remaining, resetSeconds: ttl > 0 ? ttl : windowSec };
}

/**
 * Record a hit for `identifier` and report whether it is within `limit` hits
 * per `windowSec`. Namespacing the identifier (e.g. "checkout:1.2.3.4") keeps
 * separate endpoints from sharing a budget. Fails open if the backend errors —
 * availability beats blocking legitimate traffic on an infra hiccup.
 */
export async function rateLimit(
  identifier: string,
  { limit, windowSec }: { limit: number; windowSec: number }
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  if (!isRateLimitDurable()) return memoryLimit(key, limit, windowSec);
  try {
    return await upstashLimit(key, limit, windowSec);
  } catch (error) {
    console.error("[rate-limit] backend error, failing open:", error);
    return { ok: true, remaining: limit, resetSeconds: windowSec };
  }
}

/** Best-effort client IP from proxy headers. Returns "" when unknown. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    ""
  );
}
