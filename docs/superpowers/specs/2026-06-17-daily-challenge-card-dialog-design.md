# Daily Challenge Card with Animated Dialog

**Date:** 2026-06-17
**Status:** Approved
**Replaces:** `DailyBoltOverlay` full-screen auto-trigger

---

## Problem

The current Daily Bolt auto-takes over the entire screen on dashboard mount if the user hasn't practiced today. This is aggressive — the user opens the dashboard to check something and is blocked by a full-screen overlay they didn't ask for.

## Solution

Replace the auto-triggering full-screen overlay with a dashboard card the user opts into. Tapping "Take Challenge" morphs the card into a centered dialog via Framer Motion shared-element layout animation. The dialog contains the same single-question flow. After completion, the card disappears and the existing bolt-complete banner takes over.

## Design Decisions (15 resolved)

| #   | Decision                          | Choice                                                        | Rationale                                                         |
| --- | --------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Which daily challenge to redesign | Daily Bolt (not 3-goal tracker)                               | Bolt is the primary daily action; auto-takeover is the UX problem |
| 2   | Animation approach                | True shared-element morph (`layoutId`)                        | Matches motion.dev docs, feels like card "opens up"               |
| 3   | Dialog content                    | Single question, same as current bolt                         | Keeps low-commitment "just one tap" value prop                    |
| 4   | Auto-trigger behavior             | Remove entirely                                               | Card always on dashboard, user opts in                            |
| 5   | Dialog sizing                     | Centered medium (`max-w-md`)                                  | Standard pattern, cleanest morph from small card                  |
| 6   | Card when challenge is due        | CTA state (bolt icon, subject label, "Take Challenge" button) | Clear call-to-action, single purpose                              |
| 7   | Post-answer behavior              | Celebration inline in dialog                                  | Emotional moment stays in the same frame user acted in            |
| 8   | Card after completion same day    | Card disappears entirely                                      | Bolt-complete banner handles done state; no redundancy            |
| 9   | Card position in dashboard        | Top of stack, after hero banner                               | Primary daily CTA should be first actionable thing                |
| 10  | Old overlay component             | Refactor in-place                                             | State machine, DI seams, and tests are well-tested                |
| 11  | `layoutId` structure              | Single `layoutId` on card shell                               | Frame morphs, content crossfades inside                           |
| 12  | Dialog state ownership            | Inside the card component                                     | Self-contained, no prop drilling or context                       |
| 13  | 3-goal DailyChallenges card       | Both stay                                                     | Different jobs: CTA vs progress tracking                          |
| 14  | "Practice more" link              | Remove                                                        | Single clear exit ("Done"), no competing CTAs                     |
| 15  | Side effect ownership             | Keep in parent (`dashboard-client.tsx`)                       | Cross-cutting concerns belong at orchestration layer              |

## Architecture

### Component: `DailyChallengeCard`

**Location:** `src/components/dashboard/daily-challenge-card.tsx`

**States:**

- **Not-yet-taken:** Shows bolt icon, "Today's Challenge" title, subject label (e.g. "Mathematics — your weakest subject"), "Take Challenge" button
- **Already-taken:** Card renders nothing (returns `null`). Parent's bolt-complete banner handles done state.

**Props:**

```typescript
interface DailyChallengeCardProps {
  onComplete: (result: BoltResult) => void;
}
```

**Internal state:**

- `isOpen: boolean` — controls dialog open/close
- `subject: string` — resolved weakest subject (set on dialog open)

**Layout animation:**

```tsx
<m.div layoutId="daily-challenge">
  {/* Card content (CTA state) */}
  {isOpen && (
    <AnimatePresence mode="wait">
      <DailyChallengeDialog
        subject={subject}
        onComplete={handleComplete}
        onClose={() => setIsOpen(false)}
      />
    </AnimatePresence>
  )}
</m.div>
```

### Component: `DailyChallengeDialog`

**Location:** `src/components/dashboard/daily-challenge-dialog.tsx`

**Wraps:** Existing `DailyBoltOverlay` state machine logic (refactored in-place)

**Phases:** Same as current bolt — resolving, loading, answering, celebrating, error, empty

**Outer shell:** Uses `Dialog` + `DialogContent` from `@/components/ui/dialog`

- `layoutId="daily-challenge"` matches the card
- `DialogContent` centered, `max-w-md`

**Content phases:**

1. **Resolving/Loading:** Skeleton with "Charging your bolt" message
2. **Answering:** `<QuestionCard>` with the single question, sticky "Finish" button
3. **Celebrating:** `<BoltCelebration>` with result, XP earned, streak badge. Single "Done" button (no "Practice more" link)
4. **Error/Empty:** Error state with retry, or "no question ready" with skip

### Data Flow

```
DashboardClient mounts
  |
  v
DailyChallengeCard reads useGamification()
  |-- checks lastPracticeDate !== today
  |-- if not due: returns null
  |-- if due: renders CTA card
  |
  v
User taps "Take Challenge"
  |-- setIsOpen(true)
  |-- resolveWeakestSubject() via DI
  |-- useQuestionEngine({ subject, count: 1 })
  |
  v
Dialog opens (layoutId morph: card → centered dialog)
  |-- Phase: loading → answering
  |-- User answers question
  |-- Phase: answering → celebrating
  |
  v
User taps "Done"
  |-- onComplete(result) fires
  |-- Parent handleBoltComplete runs 8 side effects:
  |   1. updateStreak()
  |   2. addXp(1, accuracy, streak)
  |   3. checkAndUnlockAchievements()
  |   4. checkForRewardChests()
  |   5. trackQuestionResult()
  |   6. addWrongAnswer() (if incorrect)
  |   7. flashcardEngine.create() (if incorrect)
  |   8. enqueue("analytics-sync")
  |-- Dialog closes (onComplete → setIsOpen(false))
  |-- Card returns null (challenge done today)
  |-- Bolt-complete banner shows at top of dashboard
```

### Changes to Existing Files

| File                                                  | Change                                                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/dashboard/daily-bolt-overlay.tsx`     | Refactor: rename to `daily-challenge-dialog.tsx`, change outer shell from `fixed inset-0` to `Dialog` + `layoutId`                    |
| `src/components/dashboard/daily-bolt-overlay-deps.ts` | Rename to `daily-challenge-dialog-deps.ts` (DI seam stays, filename changes)                                                          |
| `src/components/dashboard/daily-challenge-card.tsx`   | **New file** — card component with CTA state + dialog state management                                                                |
| `src/components/dashboard/dashboard-client.tsx`       | Remove `showDailyBolt` state and `DailyBoltOverlay` rendering. Add `DailyChallengeCard` at position #2-3. `handleBoltComplete` stays. |
| `src/components/dashboard/dashboard-content.tsx`      | No changes (bolt-complete banner stays as-is)                                                                                         |
| `src/components/dashboard/daily-challenges.tsx`       | No changes (3-goal card stays at #23)                                                                                                 |
| `src/components/dashboard/bolt-celebration.tsx`       | Remove "Practice more" link prop                                                                                                      |

### Layout Animation Choreography

1. **Card state:** `<m.div layoutId="daily-challenge">` renders the CTA card content
2. **Open trigger:** User taps "Take Challenge" → `isOpen = true`
3. **AnimatePresence:** `mode="wait"` exits card content (fade out), then enters dialog content
4. **Framer Motion:** `layoutId` causes the frame to animate from card position/size to dialog position/size (centered, `max-w-md`)
5. **Inside frame:** Content crossfades via inner `AnimatePresence` between loading → answering → celebrating phases
6. **Close trigger:** User taps "Done" → `onComplete(result)` fires → `isOpen = false`
7. **AnimatePresence:** Dialog content exits, card content would re-enter — but card returns `null` (challenge done), so frame simply animates to nothing

### Key Constraint

The card must use `useReducedMotion()` — if the user prefers reduced motion, skip the `layoutId` morph and use a simple fade/scale transition instead.

## What Stays the Same

- `DailyBoltOverlay` state machine logic (5 phases, DI seams, error handling)
- `handleBoltComplete` callback and all 8 side effects in `dashboard-client.tsx`
- `BoltCelebration` component (reused inside dialog)
- `DailyChallenges` 3-goal card (stays at widget #23)
- `DailyProgressRing` (stays in stats row)
- Bolt-complete banner (stays in `dashboard-content.tsx`)
- `daily-bolt-overlay-deps.ts` DI seam (stays, renamed)

## What Changes

- `DailyBoltOverlay` outer shell: `fixed inset-0 z-overlay` → card + dialog with `layoutId`
- Auto-trigger on mount removed entirely
- Card position: top of dashboard stack (after hero banner)
- Card lifecycle: visible when challenge due, invisible when complete
- "Practice more" link removed from celebration

## Testing

- Existing `daily-bolt-overlay.test.tsx` tests updated for new component name and dialog shell
- `bolt-celebration.test.tsx` tests updated to remove "Practice more" assertion
- New test: `daily-challenge-card.test.tsx` — renders CTA when due, returns null when complete, opens dialog on click
- Verify layout animation works with `useReducedMotion` enabled

## Out of Scope

- Soft nudge (auto-scroll to card on mount) — can be added later
- Time-based auto-trigger (e.g. 6pm reminder) — separate feature
- Merging 3-goal card with bolt card — different concerns, both stay
