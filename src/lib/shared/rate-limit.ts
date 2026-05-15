import { RateLimiter, getRateLimitHeaders, type RateLimitConfig } from "@/lib/rate-limiter/core";

const API_CONFIG: RateLimitConfig = { max: 10, windowMs: 60 * 1000 };

const rateLimiter = new RateLimiter();

setInterval(() => rateLimiter.cleanup(), API_CONFIG.windowMs);

export function checkRateLimit(ip: string): {
	allowed: boolean;
	remaining: number;
	resetAt: number;
} {
	return rateLimiter.check(ip, API_CONFIG);
}

export { getRateLimitHeaders };
