const MAX_SIGNIN_ATTEMPTS = 3;
const SIGNIN_WINDOW_MS = 5 * 60 * 1000;
const MAGIC_LINK_COOLDOWN_MS = 5 * 60 * 1000;

interface RateLimitRecord {
	count: number;
	resetAt: number;
	windowStart: number;
}

const signInMap = new Map<string, RateLimitRecord>();
const magicLinkMap = new Map<string, RateLimitRecord>();

export function checkSignInRateLimit(email: string): {
	allowed: boolean;
	remaining: number;
	resetAt: number;
} {
	const now = Date.now();
	const key = email.toLowerCase().trim();
	const record = signInMap.get(key);

	if (!record || record.resetAt < now) {
		signInMap.set(key, {
			count: 1,
			resetAt: now + SIGNIN_WINDOW_MS,
			windowStart: now,
		});
		return {
			allowed: true,
			remaining: MAX_SIGNIN_ATTEMPTS - 1,
			resetAt: now + SIGNIN_WINDOW_MS,
		};
	}

	if (record.count >= MAX_SIGNIN_ATTEMPTS) {
		return { allowed: false, remaining: 0, resetAt: record.resetAt };
	}

	record.count++;
	return {
		allowed: true,
		remaining: MAX_SIGNIN_ATTEMPTS - record.count,
		resetAt: record.resetAt,
	};
}

export function resetSignInRateLimit(email: string): void {
	const key = email.toLowerCase().trim();
	signInMap.delete(key);
}

export function checkMagicLinkRateLimit(email: string): {
	allowed: boolean;
	resetAt: number;
} {
	const now = Date.now();
	const key = email.toLowerCase().trim();
	const record = magicLinkMap.get(key);

	if (!record || record.resetAt < now) {
		magicLinkMap.set(key, {
			count: 1,
			resetAt: now + MAGIC_LINK_COOLDOWN_MS,
			windowStart: now,
		});
		return { allowed: true, resetAt: now + MAGIC_LINK_COOLDOWN_MS };
	}

	return { allowed: false, resetAt: record.resetAt };
}
