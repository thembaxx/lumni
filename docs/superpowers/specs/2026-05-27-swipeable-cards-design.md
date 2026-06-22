# Swipeable Flashcard Deck — Design Spec

**Date:** 2026-05-27
**Status:** Draft

## Overview

Replace the current tap-to-flip + button-based flashcard review UI with a Tinder-style swipeable card deck. The core study loop becomes tactile and gesture-driven while preserving the full SM-2 quality system underneath.

## Components

### `SwipeableCardDeck` (new)

- **Path:** `src/components/flashcard/swipeable-card-deck.tsx`
- **Props:**
  - `cards: FlashcardCardData[]` — cards to review
  - `onReview: (cardId: string, quality: number) => void` — existing callback
  - `mode: "simple" | "sm2"` — binary vs full SM-2 quality flow
- **State machine:** `IDLE → DRAGGING → SWIPED → QUALITY_PICK (sm2 only) → ADVANCING`
- **Stack visualization:** 3-card cascade (top card full, 2 below at `y: 16px` / `y: 32px` with alternating `±2deg` rotation)
- **Undo:** Brief "Undo" button for 3s after each swipe; maintains a stack of `{cardId, direction}`

### `SwipeableCard` (new)

- **Path:** `src/components/flashcard/swipeable-card.tsx`
- Renders a single draggable card with flip and swipe
- **Tap** to flip (rotateY via framer-motion, existing animation)
- **Drag** (`drag="x"`, `dragElastic={0.7}`) with live visual feedback:
  - Card rotates proportionally: `rotate = dragX * 0.05` (max ~15deg)
  - Colored gradient overlay: green on right, red on left (opacity 0→0.15)
- **On release:**
  - `|velocityX| > 500` or `|dragX| > 25% width` → snap off in direction
  - Otherwise → spring back with `springTransition`
- **Exit animation:** rotate further, scale to 0.8, opacity to 0, fly off
- **Respects reduced motion:** skip rotation/spring, instant transitions

### `QualityPicker` (new, SM-2 mode only)

- **Path:** `src/components/flashcard/quality-picker.tsx`
- Appears briefly after card exits (slides up from bottom of card area)
- **Swiped RIGHT:** "Hard" (3) / "Good" (4, default) / "Easy" (5) — green tones
- **Swiped LEFT:** "Blackout" (0) / "Remembered" (1, default) / "Easy" (2) — red tones
- Auto-advances after 1.5s if no selection
- On selection: fires `onReview` with exact quality, advances deck

## Hook

### `useSwipeDeck` (new)

- **Path:** `src/hooks/use-swipe-deck.ts`
- Manages:
  - Deck order and `currentIndex`
  - Drag state transitions (`idle/dragging/swiped/picking/advancing`)
  - Swipe history for undo (array, max 10 entries)
  - `pendingRef` guard — ignores drags during exit animation
- **Returns:** `{ state, currentCard, remainingCards, swipeDirection, undo, canUndo, advance }`

## Migration

| File                                                | Change                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/app/[locale]/flashcards/flashcards-active.tsx` | Replace card rendering block (~lines 80-190) with `<SwipeableCardDeck mode="sm2">` |
| `src/components/quiz/flashcard.tsx`                 | Replace or wrap with `<SwipeableCardDeck mode="simple">` — keep as fallback export |
| `src/components/study/sm2-study-session.tsx`        | Replace with `<SwipeableCardDeck mode="sm2">`                                      |
| `src/app/[locale]/flashcards/flashcards-client.tsx` | Minimal — same data flow, passes same `cards` and `onReview`                       |

All existing features preserved: confetti, XP gain popup, keyboard shortcuts (Space/Enter=flip, ArrowLeft/ArrowRight=swipe substitute, Esc=undo), progress counter, empty state.

## Edge Cases

| Case                | Handling                                      |
| ------------------- | --------------------------------------------- |
| 0 cards             | Render `<EmptyState>`                         |
| 1 card              | No cascade, single card, swipe works normally |
| Rapid swipes        | `pendingRef` guard during exit animation      |
| Swipe while flipped | Auto-flip back before advancing               |
| Undo on last card   | Reinserts, deck re-opens                      |
| Reduced motion      | Skip rotation/spring, instant transitions     |
| Keyboard access     | ArrowLeft/ArrowRight as swipe substitute      |
| Touch + mouse       | framer-motion `drag` handles both             |

## Testing

- Unit tests for `useSwipeDeck`: drag state transitions, undo stack, quality mapping
- Component test for `SwipeableCard`: tap to flip, drag threshold, exit animation callback
- Existing flashcard integration tests unchanged (same `onReview` data flow)
