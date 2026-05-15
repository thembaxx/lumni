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

export function isOnline(): boolean {
	return navigator.onLine;
}
