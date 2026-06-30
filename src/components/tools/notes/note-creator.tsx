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
    </m.div>
  );
}
