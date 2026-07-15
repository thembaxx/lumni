import { enqueue } from "@/lib/orchestrator/job-queue";
import type { ContentDataAccess } from "@/lib/db/data-access";
import type { BookmarkRecord } from "@/lib/db/schema";

export interface BookmarkService {
  getAll(): Promise<BookmarkRecord[]>;
  add(params: Omit<BookmarkRecord, "id">): Promise<void>;
  remove(questionId: string): Promise<void>;
  updateNote(questionId: string, note: string): Promise<void>;
  isBookmarked(questionId: string): Promise<boolean>;
}

export class DexieBookmarkService implements BookmarkService {
  constructor(private db: ContentDataAccess) {}

  getAll(): Promise<BookmarkRecord[]> {
    return this.db.bookmarks.toArray();
  }

  async add(params: Omit<BookmarkRecord, "id">): Promise<void> {
    await this.db.bookmarks.add(params);
  }

  async remove(questionId: string): Promise<void> {
    await this.db.bookmarks.where("questionId").equals(questionId).delete();
    enqueue("appwrite-bookmark-delete", { questionId });
  }

  async updateNote(questionId: string, note: string): Promise<void> {
    await this.db.bookmarks.where("questionId").equals(questionId).modify({ note });
  }

  async isBookmarked(questionId: string): Promise<boolean> {
    const count = await this.db.bookmarks.where("questionId").equals(questionId).count();
    return count > 0;
  }
}

import { dexieDataAccess } from "@/lib/db";

function createBookmarkService(db: ContentDataAccess = dexieDataAccess) {
  return new DexieBookmarkService(db);
}
export const bookmarkService = createBookmarkService();
