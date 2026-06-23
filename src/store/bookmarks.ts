import { create } from "zustand";
import { bookmarkService } from "@/lib/bookmark-service";
import type { BookmarkRecord } from "@/lib/db/schema";

export interface Bookmark {
  id: string;
  questionText: string;
  subject: string;
  topic: string;
  savedAt: number;
  note?: string;
}

interface BookmarksState {
  bookmarks: Bookmark[];
  hydrated: boolean;
  addBookmark: (bookmark: Omit<Bookmark, "savedAt">) => void;
  removeBookmark: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  isBookmarked: (id: string) => boolean;
  initialize: () => Promise<void>;
}

export const useBookmarksStore = create<BookmarksState>()((set, get) => ({
  bookmarks: [],
  hydrated: false,

  initialize: async () => {
    if (get().hydrated) return;
    try {
      const records = await bookmarkService.getAll();
      set({
        bookmarks: records.map(mapRecord),
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  addBookmark: (bookmark) => {
    const { bookmarks } = get();
    if (bookmarks.some((b) => b.id === bookmark.id)) return;
    const prev = bookmarks;
    const savedAt = Date.now();
    const entry = { ...bookmark, savedAt };
    set({ bookmarks: [entry, ...prev] });
    bookmarkService
      .add({
        questionId: bookmark.id,
        questionText: bookmark.questionText,
        subject: bookmark.subject,
        topic: bookmark.topic,
        note: bookmark.note,
        savedAt,
      })
      .catch(() => {
        set({ bookmarks: prev });
      });
  },

  removeBookmark: (id) => {
    const prev = get().bookmarks;
    set({ bookmarks: prev.filter((b) => b.id !== id) });
    bookmarkService.remove(id).catch(() => {
      set({ bookmarks: prev });
    });
  },

  updateNote: (id, note) => {
    set({
      bookmarks: get().bookmarks.map((b) => (b.id === id ? { ...b, note } : b)),
    });
    bookmarkService.updateNote(id, note);
  },

  isBookmarked: (id) => {
    return get().bookmarks.some((b) => b.id === id);
  },
}));

function mapRecord(r: BookmarkRecord): Bookmark {
  return {
    id: r.questionId,
    questionText: r.questionText,
    subject: r.subject,
    topic: r.topic,
    savedAt: r.savedAt,
    note: r.note,
  };
}
