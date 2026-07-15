"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dexieDataAccess } from "@/lib/db";
import type { FlashcardDeck } from "@/lib/flashcard-engine/deck-types";
import { logError } from "@/lib/shared/logger";

interface DeckWrapper {
  type: string;
  deckData: FlashcardDeck;
}

export function SharedDeckClient() {
  const { shareId } = useParams<{ shareId: string }>();
  const { push } = useRouter();
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    (async () => {
      try {
        const shared = await dexieDataAccess.sharedQuestions.get(shareId);
        if (shared) {
          const parsed = JSON.parse(shared.question as string) as DeckWrapper;
          if (parsed.type === "flashcard-deck" && parsed.deckData) {
            setDeck(parsed.deckData);
          }
        }
      } catch (err) {
        logError("SharedDeckPage", err);
      }
      setLoading(false);
    })();
  }, [shareId]);

  if (loading) {
    return (
      <PageContainer className="min-h-dvh gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </PageContainer>
    );
  }

  if (!deck) {
    return (
      <PageContainer className="gap-6 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <span className="text-2xl">?</span>
          </div>
          <h1 className="font-bold text-2xl">Deck Not Found</h1>
          <p className="max-w-md text-muted-foreground text-sm">
            This deck link may have expired or is invalid.
          </p>
        </div>
      </PageContainer>
    );
  }

  const visibleCards = expanded ? deck.cards : deck.cards.slice(0, 10);

  return (
    <PageContainer className="gap-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl tracking-tight">{deck.title}</h1>
        {deck.description && <p className="text-muted-foreground">{deck.description}</p>}
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>{deck.subject}</span>
          <span className="text-xs">&middot;</span>
          <span>{deck.cardCount} cards</span>
        </div>
      </div>

      <Button onClick={() => push(`/flashcards?subject=${encodeURIComponent(deck.subject)}`)}>
        Study This Deck
      </Button>

      <div className="flex flex-col gap-2">
        {visibleCards.map((card) => (
          <Card key={`${card.front}-${card.back}`} className="overflow-hidden">
            <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="p-4">
                <p className="ios-caption-3 mb-1 text-muted-foreground">Front</p>
                <p className="text-sm">{card.front}</p>
              </div>
              <div className="p-4">
                <p className="ios-caption-3 mb-1 text-muted-foreground">Back</p>
                <p className="text-sm">{card.back}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {deck.cards.length > 10 && !expanded && (
        <Button variant="outline" onClick={() => setExpanded(true)}>
          Show all {deck.cardCount} cards
        </Button>
      )}
    </PageContainer>
  );
}
