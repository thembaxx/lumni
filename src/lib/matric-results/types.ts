import type { MatricResult as DbMatricResult } from "@/lib/db/types";

export type { DbMatricResult };

export interface MatricResultsResponse {
  results: DbMatricResult[];
  total: number;
}
