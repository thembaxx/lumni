import {
	getRateLimitHeaders,
	type RateLimitConfig,
	RateLimiter,
} from "@/lib/rate-limiter/core";

const API_CONFIG: RateLimitConfig = { max: 10, windowMs: 60 * 1000 };

const rateLimiter = new RateLimiter();

setInterval(() => rateLimiter.cleanup(), API_CONFIG.windowMs);

export function checkRateLimit(
	ip: string,
	config?: RateLimitConfig,
): {
	allowed: boolean;
	remaining: number;
	resetAt: number;
} {
	return rateLimiter.check(ip, config ?? API_CONFIG);
}

export { getRateLimitHeaders };
