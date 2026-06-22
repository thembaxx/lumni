import type { DataAccess } from "@/lib/db/data-access";
import type { BookmarkRecord } from "@/lib/db/schema";
import { enqueue } from "@/lib/orchestrator/job-queue";
import type { BookmarkService } from "./types";

export class DexieBookmarkService implements BookmarkService {
  constructor(private db: DataAccess) {}

  getAll(): Promise<BookmarkRecord[]> {
    return this.db.bookmarks.toArray();
  }

  async add(params: Omit<BookmarkRecord, "id">): Promise<void> {
    await this.db.bookmarks.add(params);
    enqueue("appwrite-bookmark-sync", params);
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
