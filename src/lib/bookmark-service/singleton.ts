import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { DexieBookmarkService } from "./service";

export function createBookmarkService(db: DataAccess = dexieDataAccess) {
	return new DexieBookmarkService(db);
}
export const bookmarkService = createBookmarkService();
