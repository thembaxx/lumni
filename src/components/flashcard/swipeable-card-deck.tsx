"use client";

import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";
import { QualityPicker } from "@/components/flashcard/quality-picker";
import { SwipeableCard } from "@/components/flashcard/swipeable-card";
import type { FlashcardCardData } from "@/components/flashcard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { useSwipeDeck } from "@/hooks/use-swipe-deck";
import { springPresets } from "@/lib/utils/spring-presets";

interface SwipeableCardDeckProps {
  cards: FlashcardCardData[];
  subject?: string;
  mode: "simple" | "sm2";
  onReview: (cardId: string, quality: number) => void;
  onComplete?: () => void;
  knownCount?: number;
  reviewCount?: number;
  isLoading?: boolean;
}

const CARD_OFFSET = 12;
const CARD_ROTATION = 3;

export function SwipeableCardDeck({
  cards,
  subject,
  mode,
  onReview,
  onComplete,
  knownCount,
  reviewCount,
  isLoading = false,
}: SwipeableCardDeckProps) {
  const router = useRouter();
  const {
    currentIndex,
    swipeDirection,
    showQualityPicker: _showQualityPicker,
    canUndo,
    isComplete,
    onSwipeEnd,
    onQualitySelect,
    undo,
    resetPending,
  } = useSwipeDeck({
    totalCards: cards.length,
    mode,
    onReview,
  });

  const [showPicker, setShowPicker] = useState(false);
  const [pickerPolarity, setPickerPolarity] = useState<"correct" | "incorrect">("correct");
  const lastCardRef = useRef<FlashcardCardData | null>(null);
  const lastDirectionRef = useRef<"left" | "right" | null>(null);
  const cardStackRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      cardStackRef.current?.focus({ preventScroll: true });
      const topCard = cardStackRef.current?.querySelector<HTMLElement>(
        '[data-testid="swipeable-card"]',
      );
      topCard?.focus();
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  function handleSwipe(direction: "left" | "right") {
    const card = cards[currentIndex];
    if (!card) return;

    lastCardRef.current = card;
    lastDirectionRef.current = direction;

    if (mode === "sm2") {
      setPickerPolarity(direction === "right" ? "correct" : "incorrect");
      setShowPicker(true);
    } else {
      onSwipeEnd(card.id, direction);
      resetPending();
      if (currentIndex + 1 >= cards.length) onComplete?.();
    }
  }

  function handleQualitySelect(quality: number) {
    const card = lastCardRef.current;
    const direction = lastDirectionRef.current;
    if (!card || !direction) return;

    setShowPicker(false);
    onQualitySelect(card.id, direction, quality);
    resetPending();
    if (currentIndex + 1 >= cards.length) onComplete?.();
  }

  function handleQualityTimeout() {
    const card = lastCardRef.current;
    const direction = lastDirectionRef.current;
    if (!card || !direction) return;

    setShowPicker(false);
    onSwipeEnd(card.id, direction);
    resetPending();
    if (currentIndex + 1 >= cards.length) onComplete?.();
  }

  function handleUndo() {
    setShowPicker(false);
    undo();
  }

  if (isLoading) {
    return (
      <div
        className="mx-auto flex w-full max-w-md flex-col gap-4"
        role="status"
        aria-label="Loading flashcards"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-[min(25rem,60vh)] w-full rounded-card-lg" />
        <div className="flex items-center justify-between px-2">
          <Skeleton className="h-9 w-16 rounded-md" />
          <Skeleton className="h-4 w-24" />
          <div className="w-20" />
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <Card className="mx-auto w-full max-w-md" data-testid="empty-deck-message">
        <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground">No flashcards available.</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/flashcards")}>
            Generate AI flashcards
          </Button>
        </CardContent>
      </Card>
    );
  }

  const visibleCards = cards.slice(currentIndex, currentIndex + 3);
  const remainingCount = cards.length - currentIndex;

  if (isComplete && cards.length > 0) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-4 py-12">
        <div
          className="flex size-14 items-center justify-center rounded-full bg-system-accent/10 text-2xl"
          aria-hidden="true"
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-7 text-system-accent" />
        </div>
        <h2 className="font-semibold text-xl">Deck Complete!</h2>
        <p className="text-muted-foreground text-sm">You reviewed all {cards.length} cards.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4"
      role="application"
      aria-label="Flashcard deck"
      aria-busy={isLoading}
      data-testid="swipeable-card-deck"
    >
      {/* Screen reader announcement for current card */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Card ${currentIndex + 1} of ${cards.length}`}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onComplete} data-testid="exit-button">
          Quit
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" data-testid="card-counter">
            {currentIndex + 1} / {cards.length}
          </Badge>
          {knownCount !== undefined && (
            <Badge variant="secondary" className="text-success">
              {knownCount} known
            </Badge>
          )}
          {reviewCount !== undefined && (
            <Badge variant="secondary" className="text-warning">
              {reviewCount} review
            </Badge>
          )}
        </div>
      </div>

      {/* Card stack */}
      <div
        ref={cardStackRef}
        className="relative mx-auto h-[min(25rem,60vh)] w-full max-w-md"
        tabIndex={-1}
        aria-label={`Card ${currentIndex + 1} of ${cards.length}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleCards.map((card, idx) => {
            const isTopCard = idx === 0 && !showPicker;
            const stackIndex = currentIndex + idx;

            return (
              <m.div
                key={card.id}
                className="absolute inset-0"
                style={{
                  zIndex: visibleCards.length - idx,
                  y: idx * CARD_OFFSET,
                  rotate: (idx - 1) * CARD_ROTATION,
                  scale: 1 - idx * 0.03,
                }}
                initial={{ scale: 0.92, opacity: 0, y: 40 }}
                animate={{
                  scale: 1 - idx * 0.03,
                  opacity: 1,
                  y: idx * CARD_OFFSET,
                  rotate: (idx - 1) * CARD_ROTATION,
                }}
                exit={{
                  scale: 0.8,
                  opacity: 0,
                  x: swipeDirection === "right" ? 400 : -400,
                  rotate: swipeDirection === "right" ? 20 : -20,
                  transition: springPresets.cardExit,
                }}
                transition={{
                  ...springPresets.standard,
                  delay: idx * 0.04,
                }}
                layout
              >
                {isTopCard ? (
                  <SwipeableCard
                    id={card.id}
                    front={card.front}
                    back={card.back}
                    topic={card.topic}
                    difficulty={card.difficulty}
                    hint={card.hint}
                    subject={subject}
                    isTop={true}
                    mode={mode}
                    onSwipe={handleSwipe}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="h-full w-full rounded-card-lg border border-border/60 bg-system-background/95 p-6 shadow-level-1"
                  >
                    <div className="flex h-full items-center justify-center">
                      <p className="text-center text-muted-foreground/60">{stackIndex + 1}</p>
                    </div>
                  </div>
                )}
              </m.div>
            );
          })}
        </AnimatePresence>

        {/* Quality picker overlay */}
        {showPicker && (
          <m.div
            className="absolute inset-0 z-overlay flex items-center justify-center rounded-card-lg bg-system-background/95"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springPresets.fast}
          >
            <QualityPicker
              polarity={pickerPolarity}
              onSelect={handleQualitySelect}
              onTimeout={handleQualityTimeout}
            />
          </m.div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-2">
        <div className="w-20">
          {canUndo && (
            <Button variant="ghost" size="sm" onClick={handleUndo}>
              Undo
            </Button>
          )}
        </div>

        <div className="text-muted-foreground text-xs">{remainingCount} remaining</div>

        <div className="w-20" />
      </div>
    </div>
  );
}
