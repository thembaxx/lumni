import { dexieDataAccess } from "@/lib/db";
import type { ContentDataAccess } from "@/lib/db/data-access";
import { DexieBookmarkService } from "./service";

function createBookmarkService(db: ContentDataAccess = dexieDataAccess) {
  return new DexieBookmarkService(db);
}
export const bookmarkService = createBookmarkService();
