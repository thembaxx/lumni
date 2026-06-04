import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bookmarkService } from "@/lib/bookmark-service";

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
	addBookmark: (bookmark: Omit<Bookmark, "savedAt">) => void;
	removeBookmark: (id: string) => void;
	updateNote: (id: string, note: string) => void;
	isBookmarked: (id: string) => boolean;
}

export const useBookmarksStore = create<BookmarksState>()(
	persist(
		(set, get) => ({
			bookmarks: [],

			addBookmark: (bookmark) => {
				const { bookmarks } = get();
				if (bookmarks.some((b) => b.id === bookmark.id)) return;
				const savedAt = Date.now();
				const entry = { ...bookmark, savedAt };
				set({ bookmarks: [entry, ...bookmarks] });
				bookmarkService.add({
					questionId: bookmark.id,
					questionText: bookmark.questionText,
					subject: bookmark.subject,
					topic: bookmark.topic,
					note: bookmark.note,
					savedAt,
				});
			},

			removeBookmark: (id) => {
				set({ bookmarks: get().bookmarks.filter((b) => b.id !== id) });
				bookmarkService.remove(id);
			},

			updateNote: (id, note) => {
				set({
					bookmarks: get().bookmarks.map((b) =>
						b.id === id ? { ...b, note } : b,
					),
				});
				bookmarkService.updateNote(id, note);
			},

			isBookmarked: (id) => {
				return get().bookmarks.some((b) => b.id === id);
			},
		}),
		{
			name: "lumni_bookmarks",
		},
	),
);
