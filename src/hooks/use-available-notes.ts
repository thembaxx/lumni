"use client";

import { useCallback } from "react";
import { dexieDataAccess } from "@/lib/db";

export function useAvailableNotes() {
  const getNotes = useCallback(async (): Promise<{ id: string; title: string }[]> => {
    const notes = await dexieDataAccess.notes.toArray();
    return notes.map((n) => ({ id: n.uuid, title: n.title }));
  }, []);

  return { getNotes };
}
