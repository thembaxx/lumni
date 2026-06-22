import type { BookmarkRecord } from "@/lib/db/schema";

export interface BookmarkService {
  getAll(): Promise<BookmarkRecord[]>;
  add(params: Omit<BookmarkRecord, "id">): Promise<void>;
  remove(questionId: string): Promise<void>;
  updateNote(questionId: string, note: string): Promise<void>;
  isBookmarked(questionId: string): Promise<boolean>;
}
