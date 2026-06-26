"use client";

import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNoteStorage } from "@/hooks/use-note-storage";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import { exportNoteAsMarkdown } from "@/lib/utils/note-export";
import { NoteForm } from "./note-form";
import type { Note } from "./types";

interface NoteCreatorProps {
  className?: string;
}

export function NoteCreator({ className }: NoteCreatorProps) {
  return (
    <AppErrorBoundary>
      <NoteCreatorInner className={className} />
    </AppErrorBoundary>
  );
}

function NoteCreatorInner({ className }: NoteCreatorProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const { notes, addNote, removeNote, updateNote, toggleFavorite } = useNoteStorage();
  const [isCreating, setIsCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites">("all");

  const handleCreateNote = (note: Note) => {
    addNote(note);
    setIsCreating(false);
  };

  const handleUpdateNote = (note: Note) => {
    if (editingNoteId) {
      updateNote(editingNoteId, note);
    }
    setIsCreating(false);
    setEditingNoteId(null);
  };

  const handleDeleteNote = (id: string) => {
    removeNote(id);
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filter === "favorites") {
      return note.isFavorite === true;
    }
    return true;
  });

  return (
    <m.div
      className={cn("mx-auto w-full max-w-2xl", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: iOSEase }}
    >
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="font-bold text-2xl">Note Creator</CardTitle>
          <p className="text-muted-foreground">Create, organize, and review your study notes</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
              {notes.length > 0 && (
                <p className="text-muted-foreground text-xs">{notes.length} notes total</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded px-3 py-1 text-sm",
                  filter === "all"
                    ? "bg-accent/20 text-accent"
                    : "text-muted-foreground hover:bg-accent/10",
                )}
              >
                All
              </Button>
              <Button
                variant="outline"
                onClick={() => setFilter("favorites")}
                className={cn(
                  "rounded px-3 py-1 text-sm",
                  filter === "favorites"
                    ? "bg-accent/20 text-accent"
                    : "text-muted-foreground hover:bg-accent/10",
                )}
              >
                Favorites ({notes.filter((n) => n.isFavorite).length})
              </Button>
            </div>
            <Button variant="outline" onClick={() => setIsCreating(true)} className="shrink-0">
              New Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredNotes.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="font-medium text-lg">Your Notes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {filteredNotes.map((note) => (
              <m.div
                key={note.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: iOSEase }}
                className="rounded-3xl border p-4 transition-colors hover:bg-accent/5"
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
                        onClick={() => handleToggleFavorite(note.id)}
                        aria-label="Remove from favorites"
                      >
                        <m.div
                          whileTap={{ scale: 0.96 }}
                          transition={{ duration: 0.2, ease: iOSEase }}
                        >
                          <svg
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
                        </m.div>
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
                    <m.div whileTap={{ scale: 0.96 }} transition={{ duration: 0.2, ease: iOSEase }}>
                      <svg
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
                    </m.div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingNoteId(note.id);
                      setIsCreating(true);
                    }}
                    aria-label="Edit note"
                  >
                    <m.div whileTap={{ scale: 0.96 }} transition={{ duration: 0.2, ease: iOSEase }}>
                      <svg
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
                    </m.div>
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteNote(note.id)}
                    aria-label="Delete note"
                  >
                    <m.div whileTap={{ scale: 0.96 }} transition={{ duration: 0.2, ease: iOSEase }}>
                      <svg
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
                    </m.div>
                  </Button>
                </div>
              </m.div>
            ))}
          </CardContent>
        </Card>
      )}

      {filteredNotes.length === 0 && notes.length > 0 && (
        <Card className="py-8 text-center">
          <p className="text-muted-foreground">No notes match your search</p>
        </Card>
      )}

      {filteredNotes.length === 0 && notes.length === 0 && (
        <Card className="py-8 text-center">
          <p className="text-muted-foreground">
            You haven't created any notes yet. Click "New Note" to get started!
          </p>
        </Card>
      )}

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="w-full max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNoteId ? "Edit Note" : "Create New Note"}</DialogTitle>
            <DialogDescription>Create or edit a note for studying</DialogDescription>
          </DialogHeader>
          <NoteForm
            initialValues={
              editingNoteId ? notes.find((n) => n.id === editingNoteId) || undefined : undefined
            }
            onSubmit={(note) => {
              if (editingNoteId) {
                handleUpdateNote(note);
              } else {
                handleCreateNote(note);
              }
              setIsCreating(false);
              setEditingNoteId(null);
            }}
            onCancel={() => {
              setIsCreating(false);
              setEditingNoteId(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </m.div>
  );
}
