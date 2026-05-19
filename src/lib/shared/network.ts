export interface RetryOptions {
	maxRetries?: number;
	initialDelay?: number;
	maxDelay?: number;
	onRetry?: (attempt: number, error: Error) => void;
}

const defaultRetryOptions: Required<RetryOptions> = {
	maxRetries: 3,
	initialDelay: 1000,
	maxDelay: 30000,
	onRetry: () => {},
};

export async function withRetry<T>(
	fn: () => Promise<T>,
	options?: RetryOptions,
): Promise<T> {
	const opts = { ...defaultRetryOptions, ...options };
	let lastError: Error | undefined;

	for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			if (attempt < opts.maxRetries) {
				opts.onRetry(attempt, lastError);
				const delay = Math.min(opts.initialDelay * 2 ** attempt, opts.maxDelay);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError!;
}

export function isOnline(): boolean {
	return navigator.onLine;
}
