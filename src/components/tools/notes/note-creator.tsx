"use client";

import NoteIcon from "@hugeicons/core-free-icons/NoteIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
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
import { NoteForm } from "./note-form";
import { NoteList } from "./note-list";
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

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    return filter !== "favorites" || note.isFavorite === true;
  });

  return (
    <div className={cn("flex h-full flex-col overflow-y-auto", className)}>
      <div className="px-5 pt-5 pb-3">
        <h2 className="ios-title-3 flex items-center gap-2 text-(--system-text-primary)">
          <HugeiconsIcon icon={NoteIcon} className="size-5 text-(--system-accent)" />
          Note Creator
        </h2>
        <p className="ios-subhead mt-1 text-(--system-text-secondary)">
          Create, organize, and review your study notes
        </p>
      </div>

      <div className="px-5 pb-5">
        <div className="flex flex-col gap-4 rounded-2xl bg-system-background-secondary p-5">
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
        </div>
      </div>

      <NoteList
        notes={notes}
        filteredNotes={filteredNotes}
        onToggleFavorite={toggleFavorite}
        onDelete={removeNote}
        onEdit={(id) => {
          setEditingNoteId(id);
          setIsCreating(true);
        }}
        mounted={mounted}
      />

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
              if (editingNoteId) handleUpdateNote(note);
              else handleCreateNote(note);
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
    </div>
  );
}
