import type { MatricResult as DbMatricResult } from "@/lib/db/schema";

export type { DbMatricResult };

export interface MatricResultsResponse {
  results: DbMatricResult[];
  total: number;
}
