import { REQUEST_TIMEOUT_MS } from "./allowlist";
import type {
  TinyFishFetchOptions,
  TinyFishFetchResponse,
  TinyFishSearchOptions,
  TinyFishSearchResponse,
} from "./types";

const SEARCH_ENDPOINT = "https://api.search.tinyfish.ai";
const FETCH_ENDPOINT = "https://api.fetch.tinyfish.ai";

export class TinyFishError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "TinyFishError";
  }
}

function getApiKey(): string {
  const key = process.env.TINYFISH_API_KEY;
  if (!key) {
    throw new TinyFishError(
      "TINYFISH_API_KEY is not configured. Set it in your environment or Vercel project settings.",
    );
  }
  return key;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function tinyfishSearch(
  query: string,
  options: TinyFishSearchOptions = {},
): Promise<TinyFishSearchResponse> {
  if (!query.trim() || query.length < 2) {
    return { query, results: [], total_results: 0 };
  }

  const params = new URLSearchParams({ query });
  if (options.location) params.set("location", options.location);
  if (options.language) params.set("language", options.language);
  if (options.numResults) params.set("num_results", String(options.numResults));

  const response = await fetchWithTimeout(
    `${SEARCH_ENDPOINT}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "X-API-Key": getApiKey(),
      },
    },
    REQUEST_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new TinyFishError(
      `TinyFish search failed: ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  return (await response.json()) as TinyFishSearchResponse;
}

export async function tinyfishFetch(
  urls: string[],
  options: TinyFishFetchOptions = {},
): Promise<TinyFishFetchResponse> {
  if (urls.length === 0) {
    return { results: [], errors: [] };
  }

  const body: Record<string, unknown> = { urls };
  if (options.format) body.format = options.format;
  if (options.ttl !== undefined) body.ttl = options.ttl;

  const response = await fetchWithTimeout(
    FETCH_ENDPOINT,
    {
      method: "POST",
      headers: {
        "X-API-Key": getApiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    REQUEST_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new TinyFishError(
      `TinyFish fetch failed: ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  return (await response.json()) as TinyFishFetchResponse;
}

export function isTinyFishConfigured(): boolean {
  return Boolean(process.env.TINYFISH_API_KEY);
}
