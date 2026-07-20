import type { MatricResult } from "@/lib/db/types";

const store = new Map<string, MatricResult[]>();

function candidateKey(candidateNumber: string, examYear: number): string {
  return `${candidateNumber}:${examYear}`;
}

export function storeResults(results: MatricResult[]): number {
  const grouped = new Map<string, MatricResult[]>();
  for (const r of results) {
    const key = candidateKey(r.candidateNumber, r.examYear);
    const existing = grouped.get(key) ?? [];
    existing.push(r);
    grouped.set(key, existing);
  }
  let inserted = 0;
  for (const [key, entries] of grouped) {
    store.set(key, entries);
    inserted += entries.length;
  }
  return inserted;
}

export function getResultsByCandidate(candidateNumber: string): MatricResult[] {
  const results: MatricResult[] = [];
  for (const [key, entries] of store) {
    if (key.startsWith(`${candidateNumber}:`)) {
      results.push(...entries);
    }
  }
  return results;
}
