"use client";

import { useCallback, useEffect, useState } from "react";
import type { Note } from "@/components/tools/notes/types";

export function useNoteStorage() {
	const [notes, setNotes] = useState<Note[]>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("lumni-notes:v1");
			return saved ? JSON.parse(saved) : [];
		}
		return [];
	});
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		async function load() {
			const migrated = localStorage.getItem("lumni-notes:migrated");
			if (!migrated) {
				const saved = localStorage.getItem("lumni-notes:v1");
				if (saved) {
					const localNotes: Note[] = JSON.parse(saved);
					const db = (await import("@/lib/db/schema")).offlineDB;
					for (const n of localNotes) {
						const existing = await db.notes.where("uuid").equals(n.id).first();
						if (!existing) {
							await db.notes.add({
								uuid: n.id,
								title: n.title,
								content: n.content,
								tags: n.tags,
								subject: n.subject,
								topic: n.topic,
								isFavorite: n.isFavorite,
								createdAt: new Date(n.createdAt).getTime(),
								updatedAt: new Date(n.updatedAt).getTime(),
							});
						}
					}
					localStorage.setItem("lumni-notes:migrated", "true");
					localStorage.removeItem("lumni-notes:v1");
				} else {
					localStorage.setItem("lumni-notes:migrated", "true");
				}
			}

			const db = (await import("@/lib/db/schema")).offlineDB;
			const records = await db.notes.toArray();
			records.sort((a, b) => b.updatedAt - a.updatedAt);
			setNotes(
				records.map((r) => ({
					id: r.uuid,
					title: r.title,
					content: r.content,
					tags: r.tags,
					subject: r.subject,
					topic: r.topic,
					isFavorite: r.isFavorite,
					createdAt: new Date(r.createdAt).toISOString(),
					updatedAt: new Date(r.updatedAt).toISOString(),
				})),
			);
			setLoaded(true);
		}
		load();
	}, []);

	const saveNotes = useCallback(async (notes: Note[]) => {
		const db = (await import("@/lib/db/schema")).offlineDB;
		await db.notes.clear();
		for (const n of notes) {
			await db.notes.add({
				uuid: n.id,
				title: n.title,
				content: n.content,
				tags: n.tags,
				subject: n.subject,
				topic: n.topic,
				isFavorite: n.isFavorite,
				createdAt: new Date(n.createdAt).getTime(),
				updatedAt: new Date(n.updatedAt).getTime(),
			});
		}
		setNotes(notes);
	}, []);

	const persistNote = useCallback(async (note: Note) => {
		const db = (await import("@/lib/db/schema")).offlineDB;
		const existing = await db.notes.where("uuid").equals(note.id).first();
		const record = {
			uuid: note.id,
			title: note.title,
			content: note.content,
			tags: note.tags,
			subject: note.subject,
			topic: note.topic,
			isFavorite: note.isFavorite,
			createdAt: new Date(note.createdAt).getTime(),
			updatedAt: new Date(note.updatedAt).getTime(),
		};
		if (existing && existing.id !== undefined) {
			await db.notes.update(existing.id, record);
		} else {
			await db.notes.add(record);
		}
	}, []);

	const addNote = useCallback(
		(note: Note) => {
			setNotes((prev) => [...prev, note]);
			persistNote(note);
		},
		[persistNote],
	);

	const removeNote = useCallback((id: string) => {
		setNotes((prev) => prev.filter((note) => note.id !== id));
		(async () => {
			const db = (await import("@/lib/db/schema")).offlineDB;
			await db.notes.where("uuid").equals(id).delete();
		})();
	}, []);

	const updateNote = useCallback(
		(id: string, updates: Partial<Note>) => {
			setNotes((prev) => {
				const next = prev.map((note) =>
					note.id === id
						? { ...note, ...updates, updatedAt: new Date().toISOString() }
						: note,
				);
				const updated = next.find((n) => n.id === id);
				if (updated) persistNote(updated);
				return next;
			});
		},
		[persistNote],
	);

	const toggleFavorite = useCallback(
		(id: string) => {
			setNotes((prev) => {
				const next = prev.map((note) =>
					note.id === id ? { ...note, isFavorite: !note.isFavorite } : note,
				);
				const updated = next.find((n) => n.id === id);
				if (updated) persistNote(updated);
				return next;
			});
		},
		[persistNote],
	);

	return {
		notes,
		loaded,
		addNote,
		removeNote,
		updateNote,
		toggleFavorite,
		saveNotes,
	};
}
