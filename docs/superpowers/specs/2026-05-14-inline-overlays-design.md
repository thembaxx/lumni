# Kill the PracticeSheet: Inline Overlays Design

**Date:** 2026-05-14
**Status:** Approved

## Problem

The dashboard's `PracticeSheet` is a 95vh bottom sheet containing 4 tabs (Quiz, Exam, Focus, Stats). It creates a deep overlay stack: sheet → SubjectsDrawer → SmartViewDialog / PdfViewer. This hides the dashboard context and adds unnecessary navigation layers for content that could live inline or as page routes.

## Solution

Eliminate the `PracticeSheet` entirely. Inline simple content onto the dashboard. Promote the exam browser to a dedicated page. Replace the SubjectsDrawer overlay with an animated inline dropdown.

## Dashboard Layout (new)

Top-to-bottom order within `DashboardClient`:

1. **Hero Banner** — unchanged
2. **Countdown Header** — unchanged
3. **Stats Cards (2/3) + Daily Progress Ring (1/3)** — unchanged
4. **Focus Timer Card** — new inline card (Pomodoro timer)
5. **Today's Focus Card** — unchanged
6. **Quiz Start Card** — new inline card (subject picker + start button)
7. **Stats Expansion** — new: Achievements/Streak row + Progress Chart card
8. **Quick Actions** — updated: Exams, Study Plan, Lessons (Practice removed)

When quiz is active, all dashboard content from position 2 (Countdown Header) through 8 (Quick Actions) is hidden. The hero banner (position 1) remains visible. The quiz session view renders in place of positions 2-8, matching the existing `QuizView` pattern (full-width, 12-column grid, decorative right panel).

On quiz quit/finish, the dashboard content at positions 2-8 reappears. No data is lost — the component state unmounts cleanly.

## Components to Create / Modify

### New: `FocusTimerCard`
- Location: `src/components/dashboard/focus-timer-card.tsx`
- Compact `<Card>` component (~120px tall)
- Timer digits, start/stop button, +/-5 min controls, reset link
- Logic extracted from `FocusTab`: local `useState` for time, `useInterval` for countdown, no server/storage dependency
- Self-contained: no external state, no persistence needed

### New: `QuizStartCard`
- Location: `src/components/dashboard/quiz-start-card.tsx`
- 200-250px tall card
- Row 1: "Start a Quiz" heading
- Row 2: `SubjectSelect` dropdown + timer/points badge
- Row 3: Play button (large, disabled until subject selected)
- Row 4: Prompt text or illustration
- Uses CSS `view-transition-name: practice-trigger` for smooth morph to active quiz (progressive enhancement — Chromium-only, no-op in other browsers)

### New: `SubjectSelect`
- Location: `src/components/ui/subject-select.tsx`
- Replaces `SubjectsDrawer` everywhere
- Uses shadcn `Select` or custom dropdown with iOS spring animations
- Always searchable (the list of ~30 NSC subjects warrants a filter)
- Spring animation on open/close: scale (0.95→1) + fade, using framer-motion `{ type: "spring", stiffness: 300, damping: 30 }` (maps to project's `iOSEase` in `src/lib/utils/animation.ts`)
- Used in: QuizStartCard, ExamsPage filter

### New: `ExamsPage`
- Location: `src/app/dashboard/exams/page.tsx`
- Extracted from `ExamTab` content
- Search bar, SubjectSelect filter, session/year buttons
- Exam cards with View PDF / Smart View / Take Exam actions
- View (PdfViewer) and Smart View (SmartViewDialog) remain as overlays on this page

### Modify: `QuickActions`
- File: `src/components/dashboard/quick-actions/quick-actions.tsx`
- Remove "Practice" button
- Wire "Exams" to `router.push("/dashboard/exams")`
- Keep "Study Plan" → opens `StudyPlanSheet` (unchanged)
- Keep "Lessons" → opens `LessonsButton` (unchanged)

### New: `StatsRow` (positions 7 on dashboard)
- Location: `src/components/dashboard/stats-row.tsx`
- Composed from existing components, no new logic:
  - `StreakFire` + `Achievements` from `src/components/gamification/` (already used in StatsTab)
  - `ProgressChart` from `src/components/dashboard/progress-chart/` (already exists, used in StatsTab)
- Data sources: `useGamification()` for streak/achievements, `useUserProgress()` for chart data
- Design: two-column row on desktop (stacked on mobile). Left: Achievements + Streak. Right: Progress Chart.

### Modify: `DashboardClient`
- File: `src/components/dashboard/dashboard-client.tsx`
- Remove `PracticeSheet` import and usage
- Remove `practiceOpen` state
- Add `FocusTimerCard` at position 4
- Add `QuizStartCard` at position 6
- Add `StatsRow` at position 7
- Add quiz state management (`quizActive: boolean`, `selectedSubject: string`)
- `handlePracticeClick` → becomes `setQuizActive(true)` + `setSelectedSubject(subject)`

### Remove: `PracticeSheet`
- File: `src/components/dashboard/practice/practice-sheet.tsx` — delete
- Remove from any imports

## Data Flow

```
QuizStartCard
  └─ onStart(subject) → DashboardClient sets quizActive=true, selectedSubject=…
     └─ renders QuizView inline (replacing dashboard content)
        └─ onQuit → DashboardClient sets quizActive=false
        └─ onFinish → DashboardClient sets quizActive=false, updates stats

FocusTimerCard
  └─ self-contained (local state, no server interaction)

SubjectSelect
  └─ value: string, onChange: (subject: string) => void
  └─ subjects passed as prop from parent (parent fetches via `useSubjects()` or similar hook)
  └─ Reason: multiple consumers (QuizStartCard, ExamsPage) fetch subjects differently; single-responsibility keeps SubjectSelect as pure UI
```

## Out of Scope

- StudyPlanSheet → potential `/dashboard/study-plan` page (future)
- LessonsButton → potential `/dashboard/lessons` page (future)
- ToolsDialog → potential inline or `/dashboard/tools` (future)
- ChatDialog — immersive experience, stays as overlay
- Celebration popups — momentary interruptions, stay as overlays
