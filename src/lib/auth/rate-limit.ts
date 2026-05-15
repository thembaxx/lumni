import { RateLimiter, type RateLimitConfig } from "@/lib/rate-limiter/core";

const SIGNIN_CONFIG: RateLimitConfig = { max: 3, windowMs: 5 * 60 * 1000 };
const MAGIC_LINK_CONFIG: RateLimitConfig = { max: 1, windowMs: 5 * 60 * 1000 };

const rateLimiter = new RateLimiter();

export function checkSignInRateLimit(email: string): {
	allowed: boolean;
	remaining: number;
	resetAt: number;
} {
	const key = email.toLowerCase().trim();
	return rateLimiter.check(key, SIGNIN_CONFIG);
}

export function resetSignInRateLimit(email: string): void {
	const key = email.toLowerCase().trim();
	rateLimiter.reset(key);
}

export function checkMagicLinkRateLimit(email: string): {
	allowed: boolean;
	remaining: number;
	resetAt: number;
} {
	const key = email.toLowerCase().trim();
	return rateLimiter.check(key, MAGIC_LINK_CONFIG);
}
