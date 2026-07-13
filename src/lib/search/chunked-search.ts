import type { SearchResultItem } from "@/lib/services/search-service/types";

const TABLE_TIMEOUT_MS = 500;

export interface HandlerSpec {
  name: string;
  handler: (query: string) => Promise<SearchResultItem[]>;
}

export function scoreMatch(text: string, query: string): number {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  if (lower === q) return 100;
  if (lower.startsWith(q)) return 80;
  if (lower.includes(q)) return 50;
  return 0;
}

export async function searchInChunks(
  query: string,
  handlers: HandlerSpec[],
  maxResults = 25,
): Promise<SearchResultItem[]> {
  if (!query.trim()) return [];

  const queries = handlers.map((spec) =>
    Promise.race([
      spec.handler(query),
      new Promise<SearchResultItem[]>((_, reject) =>
        setTimeout(() => reject(new Error(`timeout:${spec.name}`)), TABLE_TIMEOUT_MS),
      ),
    ]),
  );

  const settled = await Promise.allSettled(queries);
  const allResults: SearchResultItem[] = [];

  for (const r of settled) {
    if (r.status === "fulfilled") {
      allResults.push(...r.value);
    }
  }

  return allResults
    .toSorted(
      (a, b) =>
        Math.max(scoreMatch(b.title, query), scoreMatch(b.snippet, query)) -
        Math.max(scoreMatch(a.title, query), scoreMatch(a.snippet, query)),
    )
    .slice(0, maxResults);
}
