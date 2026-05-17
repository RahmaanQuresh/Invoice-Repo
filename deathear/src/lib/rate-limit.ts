// Rate limiting using a simple in-memory store for development.
// In production, use Upstash Redis Ratelimit.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(store.entries())) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number; resetInMs: number }> {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetInMs: windowMs };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetInMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: limit - entry.count,
    resetInMs: entry.resetAt - now,
  };
}

export const RATE_LIMITS = {
  standard: { limit: 100, windowMs: 60 * 1000 }, // 100 req/min
  ai: { limit: 10, windowMs: 60 * 1000 }, // 10 req/min
  auth: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 req/15min
  share: { limit: 30, windowMs: 60 * 1000 }, // 30 req/min
} as const;
