const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export function checkRateLimit(ip: string): {
	allowed: boolean;
	remaining: number;
	resetAt: number;
} {
	const now = Date.now();
	const record = rateLimitMap.get(ip);

	if (!record || record.resetAt < now) {
		const resetAt = now + WINDOW_MS;
		rateLimitMap.set(ip, { count: 1, resetAt });
		return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
	}

	if (record.count >= MAX_REQUESTS) {
		return {
			allowed: false,
			remaining: 0,
			resetAt: record.resetAt,
		};
	}

	record.count++;
	return {
		allowed: true,
		remaining: MAX_REQUESTS - record.count,
		resetAt: record.resetAt,
	};
}

export function getRateLimitHeaders(result: ReturnType<typeof checkRateLimit>) {
	return {
		"X-RateLimit-Remaining": String(result.remaining),
		"X-RateLimit-Reset": String(result.resetAt),
		"Retry-After": result.allowed
			? ""
			: String(Math.ceil((result.resetAt - Date.now()) / 1000)),
	};
}

setInterval(() => {
	const now = Date.now();
	for (const [key, value] of rateLimitMap.entries()) {
		if (value.resetAt < now) {
			rateLimitMap.delete(key);
		}
	}
}, WINDOW_MS);
