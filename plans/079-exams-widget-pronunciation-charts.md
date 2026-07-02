# Plan 079: Dashboard Exams Widget + Pronunciation Charts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 53532ff1..HEAD -- src/lib/exam-dates/ src/components/dashboard/today-tab.tsx src/app/\[locale\]/pronunciation/pronunciation-client.tsx src/lib/pronunciation-history/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Category**: direction
- **Depends on**: none
- **Planned at**: commit `53532ff1`, 2026-07-02

## Why this matters

Two quick-win features that improve the experience for the core user base. (A) The NationalExamCalendar lives at `/exam-dates` but the dashboard — the first thing students see — has no card showing "Your next exam: Mathematics P1 in 14 days." This is a conspicuous omission for a Matric exam prep platform. (B) Pronunciation history saves 5 score dimensions per attempt but the pronunciation page only shows bare number stats and handmade div bars. The roadmap explicitly lists "show improvement charts" as C1. The data pipeline is fully built for both; only the UI is missing.

## Current state

### A — Dashboard exams widget
- `src/lib/exam-dates/service.ts` — `getUpcomingExams()` returns next exam slots with subject, date, time, duration.
- `src/lib/exam-dates/types.ts` — `ExamSlot` interface with `subject`, `subjectId`, `paperNumber`, `date`, `startTime`, `endTime`.
- `src/components/dashboard/today-tab.tsx:53-198` — 18 widgets in three sections. No exams card.
- `src/components/tools/scheduling/national-exam-calendar.tsx` — full calendar at `/exam-dates` route.
- `src/components/dashboard/countdown-header.tsx` — exists but shows a generic countdown, not exam-specific.

### B — Pronunciation charts
- `src/lib/pronunciation-history/service.ts:64-115` — `getPronunciationStats()` returns:
  ```ts
  { totalAttempts, averageScore, recentScores: { date, score }[], topWords: { word, count, avgScore }[] }
  ```
- `src/app/[locale]/pronunciation/pronunciation-client.tsx:412-437` — recent scores shown as bare div bars (inline style height/color, no chart library):
  ```tsx
  <div
    className="w-full rounded-t-md transition-[height,background-color] duration-300"
    style={{ height: `${Math.max(s.score, 4)}px`, backgroundColor: s.score >= 80 ? "var(--color-success)" : ... }}
  />
  ```
- `recharts` is already in `package.json:95` (`"recharts": "3.9.0"`).

**Repo conventions to follow**:
- Dashboard cards use `rounded-2xl`, `press-scale`, `gap-3`, `Card` primitive — see `CompetitionCard` (`src/components/dashboard/competition-card.tsx`) as pattern
- Charts use `"use client"` directive for dynamic import (recharts needs client rendering)
- Import recharts components via `dynamic(() => import("recharts").then(...))` if needed to avoid SSR issues — see `src/components/ui/charts/bar-chart.tsx` for the codebase pattern
- `today-tab.tsx` imports are at the top — add new imports following existing style

## Commands you will need

| Purpose   | Command                        | Expected on success |
|-----------|--------------------------------|---------------------|
| Typecheck | `pnpm run typecheck`           | exit 0              |
| Tests     | `pnpm run test`                | exit 0              |
| Lint      | `pnpm exec oxlint --fix`       | exit 0              |
| Verify recharts | `pnpm ls recharts`       | exit 0, version shown |

## Scope

**In scope**:
- `src/components/dashboard/upcoming-exam-card.tsx` (new) — exams countdown card
- `src/components/dashboard/today-tab.tsx` — add exams card to Priority section
- `src/app/[locale]/pronunciation/pronunciation-client.tsx` — replace div bars with recharts

**Out of scope**:
- Exam push notifications from widget (deferred)
- Per-word pronunciation charts (deferred — uses same recharts pattern)
- Changes to the full `/exam-dates` calendar page
- Theme integration for recharts (use existing color tokens from CSS vars)
- Excel/PDF export of pronunciation data

## Steps

### Step 1: Create upcoming-exam-card.tsx

Create `src/components/dashboard/upcoming-exam-card.tsx`:

- Use `"use client"` directive.
- Import and use `useQuery` from `@tanstack/react-query`.
- Fetch upcoming exams by calling `getUpcomingExams()` from `src/lib/exam-dates/service.ts` (wrapped in `queryFn`).
- Show the single closest exam in a compact card:
  - **Icon**: `Calendar03Icon` (from `@hugeicons/core-free-icons/Calendar03Icon`).
  - **Title**: Subject name + "Paper N" (e.g., "Mathematics Paper 1").
  - **Date**: Formatted date (e.g., "Mon 3 Nov 2026").
  - **Time**: Time range (e.g., "09:00 — 12:00").
  - **Countdown pill**: "Starts in 14 days" / "Ongoing" / "Ended 3d ago".
  - **CTA button**: "View Calendar" → links to `/exam-dates`.
- When no upcoming exams exist in 90 days, show: "No upcoming exams scheduled" with a minor state.
- Match the card styling of `CompetitionCard` (`rounded-2xl`, `press-scale`, `gap-3`, `Card`, same hover transition).

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Wire into today-tab.tsx

In `src/components/dashboard/today-tab.tsx`:

1. Import `UpcomingExamCard` (or `dynamic`-import it with `ssr: false`).
2. In the "Priority" section, insert after `DailyChallengeCard` and before `NextBestActionCard`/`PersonalizedFeed`:
   ```tsx
   {isLoggedIn && (
     <StaggeredSection>
       <UpcomingExamCard />
     </StaggeredSection>
   )}
   ```

**Verify**: Dashboard shows exam countdown card near the top. Build: `pnpm run typecheck` → exit 0.

### Step 3: Replace div bars with recharts bar chart

In `src/app/[locale]/pronunciation/pronunciation-client.tsx`:

1. Add imports:
   ```tsx
   import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
   ```
   (recharts is already in `package.json`).

2. Replace the inline bar chart section (lines 412-437, the `recentScores` div with `flex items-end gap-1.5`) with a proper `ResponsiveContainer` + `BarChart`:
   ```tsx
   {historyStats.recentScores.length > 0 && (
     <div className="flex flex-col gap-2">
       <span className="font-semibold text-sm">Score Trend</span>
       <ResponsiveContainer width="100%" height={160}>
         <BarChart data={historyStats.recentScores}>
           <XAxis dataKey="date" tick={{ fontSize: 10 }} />
           <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
           <Tooltip />
           <Bar dataKey="score" radius={[4, 4, 0, 0]} fill="var(--color-accent, oklch(52% 0.18 146))" />
         </BarChart>
       </ResponsiveContainer>
     </div>
   )}
   ```

3. Also add a line chart for overall trend. Import `LineChart, Line` from recharts and add below the bar chart or combined:
   ```tsx
   <ResponsiveContainer width="100%" height={120}>
     <LineChart data={historyStats.recentScores}>
       <XAxis dataKey="date" hide />
       <YAxis domain={[0, 100]} hide />
       <Line type="monotone" dataKey="score" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
     </LineChart>
   </ResponsiveContainer>
   ```

4. Wrap both charts in a single `Card` with `CardHeader` ("Pronunciation Progress") and `CardContent`.

**Verify**: `pnpm run typecheck` → exit 0. `pnpm run test` → exit 0. Pronunciation page shows proper charts.

### Step 4: Verify and lint

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint --fix` → exit 0. `pnpm exec oxfmt --check` → exit 0.

## Test plan

- No new test files needed (UI component rendering is covered by existing patterns).
- `pnpm run test` — all pass.
- Manual verification: Dashboard shows exam countdown card. Pronunciation page shows recharts bar chart and line chart instead of div bars.

## Done criteria

- [ ] `UpcomingExamCard` renders on dashboard with next exam info and countdown
- [ ] Pronunciation page shows recharts `<BarChart>` and `<LineChart>` for score trend
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The `getUpcomingExams()` function doesn't exist or has a different signature (check `src/lib/exam-dates/service.ts` and adapt).
- `recharts` is not available or has a different API (v3 → v4 migration — stop and check recharts version and API compatibility).
- The `pronunciation-client.tsx` has been heavily restructured and the bar chart section moved.

## Maintenance notes

- The exam countdown widget fetches exam dates reactively; if the service is enhanced with push-based updates, the widget should benefit automatically.
- The pronunciation charts use hardcoded accent color; if the theme system changes, update the fill/stroke values to use the chart palette from `src/components/quiz/diagrams/diagram-theme.ts`.
- The line chart is intentionally simple (no axis labels) to avoid clutter at small card sizes. A Phase 2 could add axis labels and tooltip formatting.
