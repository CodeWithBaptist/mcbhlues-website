/**
 * Small, dependency-free sliding-window rate limiter.
 *
 * Deliberately in-process: it protects a single serverless instance from being
 * used as a spam cannon and costs nothing. It is *not* a distributed limiter —
 * on a horizontally-scaled deployment each instance keeps its own window, and
 * Cloudflare Turnstile (see lib/security/turnstile.ts) is the real gate. Swap
 * the Map for Redis/Upstash if you ever need global accuracy.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

/** Stop the Map growing without bound on a long-lived instance. */
const MAX_KEYS = 5_000;

export interface RateLimitResult {
  ok: boolean;
  /** Remaining allowance in the current window. */
  remaining: number;
  /** Seconds until the caller may retry. `0` when not limited. */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (buckets.size > MAX_KEYS) {
    // Cheap eviction: drop everything that is fully expired, then, if we are
    // still over budget, drop the oldest half.
    for (const [existingKey, bucket] of buckets) {
      const alive = bucket.hits.filter((time) => time > cutoff);
      if (alive.length === 0) buckets.delete(existingKey);
      else bucket.hits = alive;
    }
    if (buckets.size > MAX_KEYS) {
      const keys = [...buckets.keys()].slice(0, Math.floor(buckets.size / 2));
      for (const staleKey of keys) buckets.delete(staleKey);
    }
  }

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((time) => time > cutoff);

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    const oldest = bucket.hits[0];
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  return { ok: true, remaining: limit - bucket.hits.length, retryAfter: 0 };
}

/**
 * Best-effort client IP. Vercel and most proxies set `x-forwarded-for`;
 * `x-real-ip` covers nginx. Falls back to a constant so the limiter degrades
 * to a global cap rather than silently doing nothing.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}
