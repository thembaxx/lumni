import { logError } from "@/lib/shared/logger";

const BUDGET_EXCEEDED_MESSAGE =
  "Daily generation limit reached. Your saved questions are still available.";

interface ApiError extends Error {
  status: number;
  limitReached?: boolean;
  remaining?: { user: number; global: number };
}

export function isBudgetExceeded(error: unknown): boolean {
  return (
    error instanceof Error && "limitReached" in error && (error as ApiError).limitReached === true
  );
}

const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504]);

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number,
  backoffMs: number,
): Promise<Response> {
  const attempt = async (remaining: number, delay: number): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (response.ok || !RETRYABLE_STATUSES.has(response.status)) {
        return response;
      }
      throw new Error(`Request failed with status ${response.status}`);
    } catch (err) {
      if (remaining <= 0) throw err instanceof Error ? err : new Error(String(err));
      await new Promise((r) => setTimeout(r, delay));
      return attempt(remaining - 1, delay * 2);
    }
  };
  return attempt(retries, backoffMs);
}

export async function apiFetch<T>(url: string, options: RequestInit, retries = 1): Promise<T> {
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

export async function budgetFetch<T>(
  url: string,
  options: RequestInit,
  context: string,
): Promise<T> {
  try {
    return await apiFetch<T>(url, options);
  } catch (error) {
    logError(context, error);
    showBudgetToast(error);
    throw error;
  }
}
