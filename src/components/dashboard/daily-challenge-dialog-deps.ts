import { dexieDataAccess } from "@/lib/db";
import type { CompetencyDataAccess } from "@/lib/db/data-access";

let _deps: { db: CompetencyDataAccess } = { db: dexieDataAccess };
export function __setDepsForTesting(deps: { db: CompetencyDataAccess }) {
  _deps = deps;
}
export { _deps };
