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

export async function apiFetch<T>(
	url: string,
	options: RequestInit,
): Promise<T> {
	const response = await fetch(url, options);

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
