import { dexieDataAccess } from "@/lib/db";
import { DexieBookmarkService } from "./service";

export const bookmarkService = new DexieBookmarkService(dexieDataAccess);
