"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useRef, useState } from "react";
import { QualityPicker } from "@/components/flashcard/quality-picker";
import { SwipeableCard } from "@/components/flashcard/swipeable-card";
import type { FlashcardCardData } from "@/components/flashcard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSwipeDeck } from "@/hooks/use-swipe-deck";
import { iOSEase } from "@/lib/utils/animation";

interface SwipeableCardDeckProps {
  cards: FlashcardCardData[];
  subject?: string;
  mode: "simple" | "sm2";
  onReview: (cardId: string, quality: number) => void;
  onComplete?: () => void;
  knownCount?: number;
  reviewCount?: number;
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
}: SwipeableCardDeckProps) {
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

  if (cards.length === 0) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground">No flashcards available.</p>
        </CardContent>
      </Card>
    );
  }

  const visibleCards = cards.slice(currentIndex, currentIndex + 3);
  const remainingCount = cards.length - currentIndex;

  if (isComplete && cards.length > 0) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="text-5xl" aria-hidden="true">
          🎉
        </div>
        <h3 className="font-semibold text-xl">Deck Complete!</h3>
        <p className="text-muted-foreground text-sm">You reviewed all {cards.length} cards.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onComplete}>
          Quit
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {currentIndex + 1} / {cards.length}
          </Badge>
          {knownCount !== undefined && (
            <Badge variant="secondary" className="text-success dark:text-success-foreground">
              {knownCount} known
            </Badge>
          )}
          {reviewCount !== undefined && (
            <Badge variant="secondary" className="text-warning dark:text-warning-foreground">
              {reviewCount} review
            </Badge>
          )}
        </div>
      </div>

      {/* Card stack */}
      <div className="relative mx-auto h-[min(400px,60vh)] w-full max-w-md">
        <AnimatePresence mode="popLayout">
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
                  transition: { duration: 0.25, ease: iOSEase },
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 28,
                  mass: 0.8,
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: iOSEase }}
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
