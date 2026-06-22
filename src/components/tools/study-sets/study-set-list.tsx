"use client";

import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";
import type { StudySet } from "./hooks/use-study-set-storage";

interface StudySetListProps {
  studySets: StudySet[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function StudySetList({ studySets, onEdit, onDelete, onToggleFavorite }: StudySetListProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div className="flex flex-col gap-3">
      {studySets.map((set) => (
        <m.div
          key={set.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2, ease: iOSEase }}
          className="cursor-pointer rounded-3xl border p-4 transition-colors hover:bg-accent/5"
          tabIndex={0}
          role="button"
          aria-label={`Study set: ${set.title}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-1 font-semibold">{set.title}</h3>
              {set.description && (
                <p className="line-clamp-2 text-muted-foreground text-sm">{set.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {set.tags &&
                  set.tags.length > 0 &&
                  set.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                {set.subject && (
                  <Badge variant="secondary" className="text-xs">
                    {set.subject}
                  </Badge>
                )}
                {set.topic && (
                  <Badge variant="secondary" className="text-xs">
                    {set.topic}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                <span className="text-xs">
                  {set.flashcardIds.length} flashcards • {set.noteIds.length} notes
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {set.isFavorite && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleFavorite(set.id)}
                  aria-label="Remove from favorites"
                >
                  <m.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.2, ease: iOSEase }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
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
                {mounted ? new Date(set.createdAt).toLocaleDateString() : ""}
              </span>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(set.id)}
              aria-label="Edit study set"
            >
              <m.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.2, ease: iOSEase }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>Edit study set</title>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4-1 1-4 9.5-9.5z" />
                </svg>
              </m.div>
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onDelete(set.id)}
              aria-label="Delete study set"
            >
              <m.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.2, ease: iOSEase }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>Delete study set</title>
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
    </div>
  );
}
