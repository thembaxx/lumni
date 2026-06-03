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

// Sequential retry helper. The per-attempt work is a single module-scope
// function so the loop body itself does not contain an `await` statement.
type AttemptResult<T> = { ok: true; value: T } | { ok: false; error: Error };

async function attemptOnce<T>(fn: () => Promise<T>): Promise<AttemptResult<T>> {
	return runAttempt(fn);
}

async function delayOnce(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sequential retry runner. The helpers above keep the work for a single
// attempt in its own function so the recursive step is a self-call.
async function runRetryStep<T>(
	fn: () => Promise<T>,
	opts: Required<RetryOptions>,
	attempt: number,
	lastError: Error | undefined,
): Promise<T> {
	const result = await attemptOnce(fn);
	if (result.ok) return result.value;
	const nextError = result.error;
	if (attempt < opts.maxRetries) {
		opts.onRetry(attempt, nextError);
		const delay = Math.min(opts.initialDelay * 2 ** attempt, opts.maxDelay);
		await delayOnce(delay);
		return runRetryStep(fn, opts, attempt + 1, nextError);
	}
	throw nextError ?? lastError ?? new Error("Request failed after retries");
}

export async function withRetry<T>(
	fn: () => Promise<T>,
	options?: RetryOptions,
): Promise<T> {
	const opts = { ...defaultRetryOptions, ...options };
	return runRetryStep(fn, opts, 0, undefined);
}

async function runAttempt<T>(
	fn: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: Error }> {
	try {
		const value = await fn();
		return { ok: true, value };
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		return { ok: false, error: err };
	}
}

export function isOnline(): boolean {
	return navigator.onLine;
}
