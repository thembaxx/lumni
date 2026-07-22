"use client";

import * as m from "motion/react-m";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { iOSEase } from "@/lib/utils/animation";
import { exportNoteAsMarkdown } from "@/lib/utils/note-export";
import type { Note } from "./types";

interface NoteListProps {
  notes: Note[];
  filteredNotes: Note[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  mounted: boolean;
}

function NoteCard({
  note,
  onToggleFavorite,
  onDelete,
  onEdit,
  mounted,
}: {
  note: Note;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  mounted: boolean;
}) {
  return (
    <m.div
      key={note.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2, ease: iOSEase }}
      className="rounded-2xl border p-4 transition-colors hover:bg-accent/5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="mb-1 font-semibold">{note.title}</h3>
          <div className="line-clamp-2 text-muted-foreground text-sm">
            {note.content.substring(0, 100)}
            {note.content.length > 100 ? "..." : ""}
          </div>
          {note.tags && note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <span key={tag} className="rounded bg-secondary/50 px-2 py-0.5 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {note.subject && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              <div className="size-2 rounded bg-accent/20" />
              <span>{note.subject}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {note.isFavorite && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite(note.id)}
              aria-label="Remove from favorites"
            >
              <div>
                <svg
                  data-icon
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>Remove from favorites</title>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            </Button>
          )}
          <span className="ml-2">
            {mounted ? new Date(note.createdAt).toLocaleDateString() : ""}
          </span>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => exportNoteAsMarkdown(note.title, note.content)}
          aria-label="Export note"
        >
          <div>
            <svg
              data-icon
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Export note</title>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(note.id)} aria-label="Edit note">
          <div>
            <svg
              data-icon
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Edit note</title>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4-1 1-4 9.5-9.5z" />
            </svg>
          </div>
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(note.id)}
          aria-label="Delete note"
        >
          <div>
            <svg
              data-icon
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Delete note</title>
              <path d="M3 6h18" />
              <path d="M19 9v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
              <path d="M8 6v.01" />
              <path d="M16 6v.01" />
            </svg>
          </div>
        </Button>
      </div>
    </m.div>
  );
}

export function NoteList({
  notes,
  filteredNotes,
  onToggleFavorite,
  onDelete,
  onEdit,
  mounted,
}: NoteListProps) {
  if (filteredNotes.length > 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-medium text-lg">Your Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDelete}
              onEdit={onEdit}
              mounted={mounted}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (notes.length > 0) {
    return (
      <Card className="py-8 text-center">
        <p className="text-muted-foreground">
          No notes match your search. Try a different search term.
        </p>
      </Card>
    );
  }

  return (
    <Card className="py-8 text-center">
      <p className="text-muted-foreground">
        You haven't created any notes yet. Click "New Note" to get started!
      </p>
    </Card>
  );
}
