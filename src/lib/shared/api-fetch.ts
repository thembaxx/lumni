const BUDGET_EXCEEDED_MESSAGE =
	"Daily generation limit reached. Your saved questions are still available.";

interface ApiError extends Error {
	status: number;
	limitReached?: boolean;
	remaining?: { user: number; global: number };
}

export function isBudgetExceeded(error: unknown): boolean {
	return (
		error instanceof Error &&
		"limitReached" in error &&
		(error as ApiError).limitReached === true
	);
}

const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504]);

async function fetchWithRetry(
	url: string,
	options: RequestInit,
	retries: number,
	backoffMs: number,
): Promise<Response> {
	let lastError: Error | null = null;
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const response = await fetch(url, options);
			if (response.ok || !RETRYABLE_STATUSES.has(response.status)) {
				return response;
			}
			lastError = new Error(`Request failed with status ${response.status}`);
			if (attempt < retries) {
				await new Promise((r) => setTimeout(r, backoffMs * 2 ** attempt));
			}
		} catch (err) {
			lastError = err instanceof Error ? err : new Error(String(err));
			if (attempt < retries) {
				await new Promise((r) => setTimeout(r, backoffMs * 2 ** attempt));
			}
		}
	}
	throw lastError ?? new Error("Request failed after retries");
}

export async function apiFetch<T>(
	url: string,
	options: RequestInit,
	retries = 1,
): Promise<T> {
	const response = await fetchWithRetry(url, options, retries, 1000);

	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		const error = new Error(
			body.error || `Request failed with status ${response.status}`,
		) as ApiError;
		error.status = response.status;

		if (response.status === 429) {
			error.limitReached = true;
			const userRemaining = response.headers.get("X-Budget-Remaining-User");
			const globalRemaining = response.headers.get("X-Budget-Remaining-Global");
			if (userRemaining || globalRemaining) {
				error.remaining = {
					user: userRemaining ? Number(userRemaining) : 0,
					global: globalRemaining ? Number(globalRemaining) : 0,
				};
			}
		}

		throw error;
	}

	return response.json();
}

export function showBudgetToast(error: unknown): void {
	if (isBudgetExceeded(error)) {
		import("@/hooks/use-toast").then(({ toast }) => {
			toast({
				type: "warning",
				message: BUDGET_EXCEEDED_MESSAGE,
				duration: 6000,
			});
		});
	}
}
