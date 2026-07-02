import { dexieDataAccess } from "@/lib/db";
import type { NotifDb } from "./types";

const DEFAULT_DEPS = Object.freeze({ db: dexieDataAccess as NotifDb });
let _deps: { db: NotifDb } = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: NotifDb }) {
  _deps = Object.freeze({ ...deps });
}

export function getDeps(): { db: NotifDb } {
  return _deps;
}
