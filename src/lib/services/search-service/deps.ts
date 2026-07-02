import { dexieDataAccess } from "@/lib/db";
import type { SearchDb } from "./types";

const DEFAULT_DEPS = Object.freeze({ db: dexieDataAccess as SearchDb });
let _deps: { db: SearchDb } = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: SearchDb }) {
  _deps = Object.freeze({ ...deps });
}

export function getDeps(): { db: SearchDb } {
  return _deps;
}
