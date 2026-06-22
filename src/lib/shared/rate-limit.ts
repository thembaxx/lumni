import { getRateLimitHeaders, type RateLimitConfig, RateLimiter } from "@/lib/rate-limiter/core";
import { RedisStore } from "@/lib/rate-limiter/redis-store";

const API_CONFIG: RateLimitConfig = { max: 10, windowMs: 60 * 1000 };

const store =
  process.env.REDIS_URL && process.env.REDIS_URL.length > 0 ? new RedisStore() : undefined;

const rateLimiter = new RateLimiter(store);

if (!store) {
  setInterval(() => rateLimiter.cleanup(), API_CONFIG.windowMs);
}

export async function checkRateLimit(
  ip: string,
  config?: RateLimitConfig,
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  return rateLimiter.check(ip, config ?? API_CONFIG);
}

export { getRateLimitHeaders };
