import { create } from "zustand";
import { persist } from "zustand/middleware";
import { offlineDB } from "@/lib/db/schema";
import { enqueue } from "@/lib/orchestrator/job-queue";

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

let migrated = false;

async function migrateFromLocalStorage() {
	if (migrated) return;
	migrated = true;
	try {
		const raw = localStorage.getItem("lumni_bookmarks");
		if (!raw) return;
		const parsed = JSON.parse(raw) as { state?: { bookmarks: Bookmark[] } };
		const oldBookmarks = parsed?.state?.bookmarks ?? [];
		if (oldBookmarks.length === 0) return;

		const existing = await offlineDB.bookmarks.toArray();
		if (existing.length > 0) return;

		await offlineDB.bookmarks.bulkPut(
			oldBookmarks.map((b, i) => ({
				id: i + 1,
				questionId: b.id,
				questionText: b.questionText,
				subject: b.subject,
				topic: b.topic,
				note: b.note,
				savedAt: b.savedAt,
			})),
		);

		localStorage.removeItem("lumni_bookmarks");
	} catch {}
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
				offlineDB.bookmarks.add({
					questionId: bookmark.id,
					questionText: bookmark.questionText,
					subject: bookmark.subject,
					topic: bookmark.topic,
					note: bookmark.note,
					savedAt,
				});
				enqueue("appwrite-bookmark-sync", {
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
				offlineDB.bookmarks.where("questionId").equals(id).delete();
				enqueue("appwrite-bookmark-delete", { questionId: id });
			},

			updateNote: (id, note) => {
				set({
					bookmarks: get().bookmarks.map((b) =>
						b.id === id ? { ...b, note } : b,
					),
				});
				offlineDB.bookmarks.where("questionId").equals(id).modify({ note });
			},

			isBookmarked: (id) => {
				return get().bookmarks.some((b) => b.id === id);
			},
		}),
		{
			name: "lumni_bookmarks",
			onRehydrateStorage: () => {
				return () => {
					migrateFromLocalStorage();
				};
			},
		},
	),
);
