"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Note } from "@/components/tools/notes/types";
import { type ContentDataAccess, dexieDataAccess } from "@/lib/db";

let _deps: { db: ContentDataAccess } = Object.freeze({ db: dexieDataAccess });
function __setDepsForTesting(deps: { db: ContentDataAccess }) {
  _deps = Object.freeze({ ...deps });
}

export function useNoteStorage() {
  const v1Item = typeof window !== "undefined" ? localStorage.getItem("lumni-notes:v1") : null;
  const migratedItem =
    typeof window !== "undefined" ? localStorage.getItem("lumni-notes:migrated") : null;

  const [notes, setNotes] = useState<Note[]>(() => {
    if (v1Item) {
      try {
        return JSON.parse(v1Item);
      } catch {
        return [];
      }
    }
    return [];
  });
  const migratedRef = useRef(!!migratedItem);

  useEffect(() => {
    if (migratedRef.current) return;
    async function load() {
      if (!migratedItem) {
        if (v1Item) {
          let localNotes: Note[] = [];
          try {
            localNotes = JSON.parse(v1Item);
          } catch {
            localNotes = [];
          }
          await Promise.all(
            localNotes.map(async (n) => {
              const existing = await _deps.db.notes.where("uuid").equals(n.id).first();
              if (!existing) {
                await _deps.db.notes.add({
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
            }),
          );
          localStorage.setItem("lumni-notes:migrated", "true");
          localStorage.removeItem("lumni-notes:v1");
        } else {
          localStorage.setItem("lumni-notes:migrated", "true");
        }
      }
      migratedRef.current = true;

      const records = await _deps.db.notes.toArray();
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
    }
    load();
  }, [migratedItem, v1Item]);

  const saveNotes = useCallback(async (notes: Note[]) => {
    await _deps.db.notes.clear();
    await Promise.all(
      notes.map((n) =>
        _deps.db.notes.add({
          uuid: n.id,
          title: n.title,
          content: n.content,
          tags: n.tags,
          subject: n.subject,
          topic: n.topic,
          isFavorite: n.isFavorite,
          createdAt: new Date(n.createdAt).getTime(),
          updatedAt: new Date(n.updatedAt).getTime(),
        }),
      ),
    );
    setNotes(notes);
  }, []);

  const persistNote = useCallback(async (note: Note) => {
    const existing = await _deps.db.notes.where("uuid").equals(note.id).first();
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
      await _deps.db.notes.update(existing.id, record);
    } else {
      await _deps.db.notes.add(record);
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
      await _deps.db.notes.where("uuid").equals(id).delete();
    })();
  }, []);

  const updateNote = useCallback(
    (id: string, updates: Partial<Note>) => {
      setNotes((prev) => {
        const next = prev.map((note) =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note,
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
    loaded: true,
    addNote,
    removeNote,
    updateNote,
    toggleFavorite,
    saveNotes,
  };
}
