import { type RateLimitConfig, RateLimiter } from "@/lib/rate-limiter/core";

const SIGNIN_CONFIG: RateLimitConfig = { max: 3, windowMs: 5 * 60 * 1000 };
const MAGIC_LINK_CONFIG: RateLimitConfig = { max: 1, windowMs: 5 * 60 * 1000 };

const rateLimiter = new RateLimiter();

function normalizeEmail(email: string): string {
	return email.toLowerCase().trim();
}

type RateLimitResult =
	| { allowed: true }
	| { allowed: false; errorMessage: string; resetAt: number };

export function attemptSignIn(email: string): RateLimitResult {
	const key = normalizeEmail(email);
	const result = rateLimiter.check(key, SIGNIN_CONFIG);
	if (!result.allowed) {
		const waitMinutes = Math.ceil((result.resetAt - Date.now()) / 60000);
		return {
			allowed: false,
			resetAt: result.resetAt,
			errorMessage: `Too many sign-in attempts. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
		};
	}
	return { allowed: true };
}

export function recordSuccessfulSignIn(email: string): void {
	const key = normalizeEmail(email);
	rateLimiter.reset(key);
}

export function attemptMagicLink(email: string): RateLimitResult {
	const key = normalizeEmail(email);
	const result = rateLimiter.check(key, MAGIC_LINK_CONFIG);
	if (!result.allowed) {
		const waitMinutes = Math.ceil((result.resetAt - Date.now()) / 60000);
		return {
			allowed: false,
			resetAt: result.resetAt,
			errorMessage: `A magic link was already sent. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
		};
	}
	return { allowed: true };
}
