"use client";

import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
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
import { useSpacedRepetition } from "@/hooks/use-spaced-repetition";
import { cn } from "@/lib/utils";
import { FlashcardCard } from "./flashcard-card";
import { EmptyFlashcardState } from "./flashcard-empty-state";
import { FlashcardForm } from "./flashcard-form";

interface FlashcardCreatorProps {
  className?: string;
}

export function FlashcardCreator({ className }: FlashcardCreatorProps) {
  return (
    <AppErrorBoundary>
      <FlashcardCreatorInner className={className} />
    </AppErrorBoundary>
  );
}

function FlashcardCreatorInner({ className }: FlashcardCreatorProps) {
  const [_mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { cards, addCard, editCard, removeCard } = useSpacedRepetition();

  const [isCreating, setIsCreating] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEditFlashcard = (card: (typeof cards)[number]) => {
    setEditingCardId(card.id);
    setIsCreating(true);
  };

  const handleDeleteFlashcard = async (id: string) => {
    await removeCard(id);
  };

  const filteredCards = cards.filter(
    (card) =>
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.back.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className={cn("flex h-full flex-col overflow-y-auto", className)}>
      <div className="px-5 pt-5 pb-3">
        <h2 className="ios-title-3 flex items-center gap-2 text-(--system-text-primary)">
          <HugeiconsIcon icon={FlashIcon} className="size-5 text-(--system-accent)" />
          Flashcard Creator
        </h2>
        <p className="ios-subhead mt-1 text-(--system-text-secondary)">
          Create, organize, and study with custom flashcards
        </p>
      </div>

      <div className="px-5 pb-5">
        <div className="flex flex-col gap-4 rounded-2xl bg-system-background-secondary p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <Input
                aria-label="Search flashcards"
                placeholder="Search flashcards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
              {cards.length > 0 && (
                <p className="text-muted-foreground text-xs">{cards.length} flashcards total</p>
              )}
            </div>
            <Button variant="outline" onClick={() => setIsCreating(true)} className="shrink-0">
              New Flashcard
            </Button>
          </div>

          {filteredCards.length > 0 && (
            <div className="flex flex-col gap-3">
              {filteredCards.map((card) => (
                <FlashcardCard
                  key={card.id}
                  card={card}
                  onEdit={handleEditFlashcard}
                  onDelete={handleDeleteFlashcard}
                />
              ))}
            </div>
          )}

          {filteredCards.length === 0 && cards.length > 0 && (
            <EmptyFlashcardState type="no-results" />
          )}
          {filteredCards.length === 0 && cards.length === 0 && (
            <EmptyFlashcardState type="no-cards" />
          )}
        </div>
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="w-full max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCardId ? "Edit Flashcard" : "Create New Flashcard"}</DialogTitle>
            <DialogDescription>Create or edit a flashcard for studying</DialogDescription>
          </DialogHeader>
          <FlashcardForm
            initialValues={
              editingCardId
                ? (() => {
                    const c = cards.find((c) => c.id === editingCardId);
                    if (!c) return undefined;
                    return {
                      front: c.front,
                      back: c.back,
                      hint: "",
                      subject: c.subject,
                      topic: c.topic || "",
                    };
                  })()
                : undefined
            }
            onSubmit={async (data) => {
              if (editingCardId) {
                await editCard(editingCardId, {
                  front: data.front,
                  back: data.back,
                  subject: data.subject,
                  topic: data.topic,
                });
              } else {
                const backText = data.hint ? `${data.back}\n\n**Hint:** ${data.hint}` : data.back;
                await addCard(data.front, backText, data.subject, data.topic);
              }
              setIsCreating(false);
              setEditingCardId(null);
            }}
            onCancel={() => {
              setIsCreating(false);
              setEditingCardId(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
