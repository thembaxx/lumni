export function safeJsonParse<T = unknown>(
	str: string,
	fallback: T | null = null,
): T | null {
	try {
		return JSON.parse(str) as T;
	} catch {
		return fallback;
	}
}

export function safeJsonStringify(value: unknown, fallback = "{}"): string {
	try {
		return JSON.stringify(value);
	} catch {
		return fallback;
	}
}
