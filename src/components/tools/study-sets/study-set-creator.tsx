"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type StudySet, useStudySetStorage } from "./hooks/use-study-set-storage";
import { StudySetForm } from "./study-set-editor";
import { StudySetList } from "./study-set-list";

interface StudySetCreatorProps {
  className?: string;
}

export function StudySetCreator({ className }: StudySetCreatorProps) {
  const { studySets, addStudySet, removeStudySet, updateStudySet, toggleFavorite } =
    useStudySetStorage();
  const [isCreating, setIsCreating] = useState(false);
  const [editingStudySetId, setEditingStudySetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites">("all");

  const handleCreateStudySet = (studySet: StudySet) => {
    addStudySet(studySet);
    setIsCreating(false);
  };

  const handleUpdateStudySet = (studySet: StudySet) => {
    if (editingStudySetId) {
      updateStudySet(editingStudySetId, studySet);
    }
    setIsCreating(false);
    setEditingStudySetId(null);
  };

  const handleDeleteStudySet = (id: string) => {
    removeStudySet(id);
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
  };

  const filteredStudySets = studySets.filter((set) => {
    const matchesSearch =
      set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (set.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filter !== "favorites" || set.isFavorite === true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={cn("flex h-full flex-col overflow-y-auto", className)}>
      <div className="px-5 pt-5 pb-3">
        <h2 className="ios-title-3 flex items-center gap-2 text-(--system-text-primary)">
          <HugeiconsIcon icon={BookOpen01Icon} className="size-5 text-(--system-accent)" />
          Study Set Creator
        </h2>
        <p className="ios-subhead mt-1 text-(--system-text-secondary)">
          Organize your flashcards and notes into study sets
        </p>
      </div>

      <div className="px-5 pb-5">
        <div className="flex flex-col gap-4 rounded-2xl bg-system-background-secondary p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <Input
                aria-label="Search study sets"
                placeholder="Search study sets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
              {studySets.length > 0 && (
                <p className="text-muted-foreground text-xs">{studySets.length} study sets total</p>
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
                Favorites ({studySets.filter((s) => s.isFavorite).length})
              </Button>
            </div>
            <Button variant="outline" onClick={() => setIsCreating(true)} className="shrink-0">
              New Study Set
            </Button>
          </div>
        </div>
      </div>

      {filteredStudySets.length > 0 && (
        <div className="px-5 pb-5">
          <StudySetList
            studySets={filteredStudySets}
            onEdit={(id) => {
              setEditingStudySetId(id);
              setIsCreating(true);
            }}
            onDelete={handleDeleteStudySet}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      )}

      {filteredStudySets.length === 0 && studySets.length > 0 && (
        <div className="px-5 pb-5">
          <Card className="py-8 text-center">
            <p className="text-muted-foreground">
              No study sets match your search. Try a different search term.
            </p>
          </Card>
        </div>
      )}

      {filteredStudySets.length === 0 && studySets.length === 0 && (
        <div className="px-5 pb-5">
          <Card className="py-8 text-center">
            <p className="text-muted-foreground">
              You haven't created any study sets yet. Click "New Study Set" to get started!
            </p>
          </Card>
        </div>
      )}

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="w-full max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStudySetId ? "Edit Study Set" : "Create New Study Set"}
            </DialogTitle>
            <DialogDescription>
              Create or edit a study set to organize your learning materials
            </DialogDescription>
          </DialogHeader>
          <StudySetForm
            initialValues={
              editingStudySetId
                ? studySets.find((s) => s.id === editingStudySetId) || undefined
                : undefined
            }
            onSubmit={(studySet) => {
              if (editingStudySetId) {
                handleUpdateStudySet(studySet);
              } else {
                handleCreateStudySet(studySet);
              }
              setIsCreating(false);
              setEditingStudySetId(null);
            }}
            onCancel={() => {
              setIsCreating(false);
              setEditingStudySetId(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
