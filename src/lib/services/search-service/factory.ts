import { getDeps } from "./deps";
import type { SearchDb, SearchResultItem } from "./types";

export function textRelevant(text: string, query: string): boolean {
  const q = query.toLowerCase();
  return text.toLowerCase().includes(q);
}

export function createTableSearch<T extends Record<string, unknown>>(
  tableName: keyof SearchDb,
  toItems: (row: T, query: string) => SearchResultItem | null,
): (query: string) => Promise<SearchResultItem[]> {
  return async (query: string) => {
    const table = getDeps().db[tableName] as unknown as { toArray(): Promise<T[]> };
    const rows = await table.toArray();
    const results: SearchResultItem[] = [];
    for (const row of rows) {
      const item = toItems(row, query);
      if (item) {
        results.push(item);
        if (results.length >= 10) break;
      }
    }
    return results;
  };
}
