export interface RetryOptions {
	maxRetries?: number;
	initialDelay?: number;
	maxDelay?: number;
	onRetry?: (attempt: number, error: Error) => void;
}

export interface NetworkError extends Error {
	statusCode?: number;
	isRetryable: boolean;
	isTimeout: boolean;
}

function isRetryableStatus(status: number): boolean {
	return status === 408 || status === 429 || status >= 500;
}

export async function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	onTimeout?: () => void,
): Promise<T> {
	let timeoutId: NodeJS.Timeout;

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			const error = new Error("Request timed out") as NetworkError;
			error.isTimeout = true;
			error.isRetryable = true;
			reject(error);
			onTimeout?.();
		}, timeoutMs);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		clearTimeout(timeoutId!);
	}
}

export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const {
		maxRetries = 3,
		initialDelay = 1000,
		maxDelay = 10000,
		onRetry,
	} = options;

	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			if (attempt > maxRetries) break;

			const networkError = error as NetworkError;
			if (!networkError.isRetryable && networkError.statusCode) {
				if (!isRetryableStatus(networkError.statusCode)) {
					break;
				}
			}

			const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
			onRetry?.(attempt, lastError);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

export async function withNetworkTimeout<T>(
	fn: () => Promise<T>,
	timeoutMs = 30000,
	options: RetryOptions = {},
): Promise<T> {
	return withRetry(() => withTimeout(fn(), timeoutMs), options);
}

export function isOnline(): boolean {
	return navigator.onLine;
}

export function createOfflineHandler(
	onOnline: () => void,
	onOffline: () => void,
): () => void {
	const handleOnline = () => onOnline();
	const handleOffline = () => onOffline();

	window.addEventListener("online", handleOnline);
	window.addEventListener("offline", handleOffline);

	return () => {
		window.removeEventListener("online", handleOnline);
		window.removeEventListener("offline", handleOffline);
	};
}
