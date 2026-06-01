# Daily Bolt — Proactive Teaching on Dashboard Entry

**Date**: 2026-06-01
**Status**: Approved

## Summary

Replace the passive dashboard scroll with a proactive single-question challenge ("Daily Bolt") that appears on every dashboard entry until completed for the day. Answer the bolt, optionally continue into a 5-question sprint, then see the dashboard.

## Trigger & Entry

- Every dashboard navigation → `DashboardClient` checks `gamification.lastPracticeDate === today`
- If **not** completed → render `<DailyBoltOverlay>` instead of tab nav + dashboard content
- User can skip at any time via "Skip → Dashboard" link (no penalty, bolt re-presents next navigation)
- Suppressed during onboarding (first 3 "Getting Started" visits — onboarding wizard takes priority)
- No blocking — skip is always available, one tap away

## User Flow

```
Dashboard entry
       │
       ▼
┌──────────────────┐     ┌──────────────┐
│  DailyBoltOverlay │────→│  Skip link   │──→ Dashboard
│  (single question)│     │  (any time)  │
└────────┬─────────┘     └──────────────┘
         │ answer
         ▼
┌──────────────────┐
│  Answer feedback  │
│  (correct/wrong + │
│   explanation)    │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────────────┐
│  Back  │ │  Continue Sprint │──→ QuizView (count=5)
│  to    │ │  (4 more Qs)     │    → handleFinishQuiz
│  Dash  │ │                  │    → Dashboard
└────────┘ └──────────────────┘
```

- Single question uses `QuestionCard` with "Today's Bolt" header + subject badge
- Immediate feedback after answer (correct/incorrect + explanation)
- Bolt XP (15 + 20 bonus) awarded on answer (calls `addXp`, `updateStreak`)
- Sprint reuses existing `QuizView` with `count=5`, `variant="full"`
- Existing `handleFinishQuiz` handles XP, streaks, achievements, wrong-answer capture, flashcard creation, analytics sync

## Question Selection

- **Single bolt question**: Weakest subject → weakest topic via competency data
  - Difficulty: Medium
  - Prefers multiple-choice (fastest interaction)
  - Generated via `useQuestionEngine` with `count: 1`
- **New users** (no competency data): Random subject rotation
- **Sprint** (4 more questions): Same subject as bolt, mixed difficulty/types
- Subject naturally rotates as weakest subject changes with improvement

## Gamification Integration

| System | Behavior |
|--------|----------|
| **Streak** | Bolt answer calls `updateStreak()` — this is the habit hook |
| **XP** | 15 base (10 + 5 if correct) + 20 bolt bonus (once/day) |
| **Sprint XP** | Standard XP only, no additional bolt bonus |
| **Daily Challenges** | All questions count toward `daily_questions`, `daily_accuracy` via existing `addXp` path |
| **Achievements** | No new achievements — bolt feeds existing streak milestones |
| **Skip** | No XP, no streak update, no penalty |

## State & Persistence

- **Zero new persistent state**: Uses `gamification.lastPracticeDate` as the "bolt done" signal
- **`showDailyBolt`**: Local React state in `DashboardClient`, derived from `lastPracticeDate`
- **Bolt overlay internal state**: Local component state (`→ loading → answering → answered → branch`)
- **Question caching**: Automatic via existing Dexie 24h cache in `useQuestionEngine`

## Edge Cases

| Case | Behavior |
|------|----------|
| Anonymous user | Bolt still shows, random subject, `lastPracticeDate` tracked in localStorage |
| Generation fails | Error overlay with "Retry" + "Skip to Dashboard" |
| User skips, returns | Bolt re-presents (lastPracticeDate unchanged) |
| User completes, returns | Bolt suppressed (lastPracticeDate === today) |
| Midnight open | Bolt done for this session; re-appears on next dashboard navigation |
| Sprint + full quiz same day | Both call `handleFinishQuiz`, gamification stacks correctly |
| 0 subjects enrolled | Random general question or suppress bolt |
| Pre-fetch | Bolt question fetched during gamification load to avoid flicker |

## Implementation Plan

### Files to create
1. `src/components/dashboard/daily-bolt-overlay.tsx` — New overlay component

### Files to modify
1. `src/components/dashboard/dashboard-client.tsx` — Add `showDailyBolt` state, render overlay
2. `src/types/gamification.ts` — Add `XP_BOLT_BONUS = 20` constant (optional)

### Component: DailyBoltOverlay
- Uses `ImmersiveMode` (hides nav)
- Internal state machine: `idle → loading → answering → answered → branching`
- Fetches single question via `useQuestionEngine({ subject: weakest, count: 1 })`
- Renders `QuestionCard` for the question
- On answer: shows feedback, calls `addXp(1, accuracy, streak)` + `updateStreak()`
- On "Back to Dashboard": sets `dailyBoltDone = true` (parent callback)
- On "Continue Sprint": fires parent callback to start `QuizView` with count=5
- "Skip" link always visible

### Integration in DashboardClient
```
const [showDailyBolt, setShowDailyBolt] = useState(true) // derived from lastPracticeDate
const [boltSubject, setBoltSubject] = useState("")
const [sprintActive, setSprintActive] = useState(false)

// When gamification loads:
//   if lastPracticeDate === today → setShowDailyBolt(false)

// Render logic:
if (showDailyBolt) → <DailyBoltOverlay onComplete={...} onSprint={...} onSkip={...} />
else if (sprintActive) → <QuizView count={5} subject={boltSubject} ... />
else → <DashboardContent ... />
```
