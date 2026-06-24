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
import { useSpacedRepetition } from "@/hooks/use-spaced-repetition";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
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
    <m.div
      className={cn("mx-auto w-full max-w-2xl", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: iOSEase }}
    >
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="font-bold text-2xl">Flashcard Creator</CardTitle>
          <p className="text-muted-foreground">
            Create, organize, and study with custom flashcards
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <Input
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
        </CardContent>
      </Card>

      {filteredCards.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="font-medium text-lg">Your Flashcards</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {filteredCards.map((card) => (
              <FlashcardCard
                key={card.id}
                card={card}
                onEdit={handleEditFlashcard}
                onDelete={handleDeleteFlashcard}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {filteredCards.length === 0 && cards.length > 0 && <EmptyFlashcardState type="no-results" />}

      {filteredCards.length === 0 && cards.length === 0 && <EmptyFlashcardState type="no-cards" />}

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
    </m.div>
  );
}
