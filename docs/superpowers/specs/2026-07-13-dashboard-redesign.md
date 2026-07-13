# Dashboard Redesign — Single-Scroll, Unified Layout

**Date**: 2026-07-13  
**Status**: Approved for implementation  
**Design read**: Full-overhaul dashboard redesign for Lumni (Matric EdTech). Same brand language as landing page (warm amber accent, Open Runde, clean ambient depth). Single scroll — no tabs.

---

## 1. Structural Changes

### 1.1 Remove 3-tab system

- Delete `TabNav` (src/components/dashboard/navigation/tab-nav.tsx)
- Delete `TabValue` type (src/components/dashboard/types.ts)
- Remove tab routing from `dashboard-client.tsx` and `dashboard-content.tsx`
- `DashboardClient` no longer passes `activeTab`/`onTabChange`/`initialTab`

### 1.2 Merge 3 tab components → single `DashboardView`

- `TodayTab` + `PracticeTab` + `AnalyticsTab` → one component at `src/components/dashboard/dashboard-view.tsx`
- No collapsible sections — flat visual zones with section headings (e.g. "Today's Plan", "Keep Going", "Your Progress")
- Every card appears exactly once (deduplicate the ~11 cards shared across tabs)

### 1.3 Remove duplicate ambient layers

- Remove `ScrollAmbient` (src/components/dashboard/scroll-ambient.tsx) — too much visual noise
- Remove `NoiseOverlay` from dashboard content — keep on landing page only
- Keep `AmbientGradient` in `dashboard-content.tsx` — provides subtle depth

### 1.4 Simplify loading state

- Remove the mock card-grid skeleton in `dashboard-client.tsx` (lines 67-75)
- Replace with a single `PageSkeleton` from `@/components/ui/skeleton`

---

## 2. Layout Zones (Top → Bottom)

All zones live in a single scroll container within `PageContainer`. Each zone has a section heading + optional description. Cards use the same design language: `rounded-card`, `shadow-level-1`, border subtlety, consistent icon size/color.

### Zone 1: Hero Banner

- **Source**: Merge `HeroBanner` (dashboard-hero.tsx) + `CountdownHeader` (countdown-header.tsx)
- **What it shows**: Time-of-day greeting, user name, days until finals, year progress bar, phase message
- **Treatment**: Single banner card with warm amber accent left border/top accent, `ShadowLevel2`, greeting in `font-extrabold text-(--fs-heading-2)`, subtext in `text-muted-foreground text-sm`
- **Contains**: `SpotlightCard` wrapper (from existing HeroBanner)

### Zone 2: Daily Pulse

- **Section heading**: "Today" with a Sparkles icon
- **Cards** (in a 2-3 column responsive grid):

| Card             | Source    | Notes                                                                                                                      |
| ---------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| Daily Challenge  | Today tab | Full-width or 2-col span. Only shown when `isDue` (not yet completed). Amber accent. Streak badge. "Take Challenge" button |
| Next Best Action | Shared    | 2-col span. AI-suggested action card. Dismissible                                                                          |
| Today's Focus    | Shared    | 2-col span. Recommended topic with subject picker + skim CTA                                                               |
| Upcoming Exam    | Today tab | 1-col. Next exam countdown. Only shown when exams exist                                                                    |

### Zone 3: Quick Actions

- **Section heading**: None — full-width horizontal scroll row
- **Source**: `QuickActions` (quick-actions.tsx) — 7 buttons (Quiz, Flashcards, Exams, Study, Tools, Review, Stats)
- **Treatment**: Same as existing — horizontal scroll with `gap-2`, icon + label buttons

### Zone 4: Your Plan

- **Section heading**: "Your Plan" with Calendar icon
- **Cards**:

| Card                | Source       | Notes                                                 |
| ------------------- | ------------ | ----------------------------------------------------- |
| Study Plan Overview | Practice tab | Full-width. Today's sessions, progress bar, bookmarks |
| Weak Topics         | Shared       | 2-col. Up to 3 weakest topics with practice buttons   |
| Study Card          | Practice tab | 1-col. "Continue Studying" — first enrolled subject   |
| My Assignments      | Practice tab | 2-col. Student assignments                            |

### Zone 5: Keep Learning

- **Section heading**: "Keep Learning" with BookOpen icon
- **Cards**:

| Card                | Source       | Notes                                      |
| ------------------- | ------------ | ------------------------------------------ |
| Question of the Day | Shared       | 1-col. Past exam question, new daily       |
| Recent Questions    | Practice tab | 2-col. Last 5 wrong-answer questions       |
| Lesson Library      | Shared       | 2-col. Continue learning — lesson progress |
| Learning Map        | Shared       | Full-width. SVG knowledge graph            |
| Vocabulary List     | Shared       | 1-col. Vocabulary progress                 |

### Zone 6: Your Progress

- **Section heading**: "Your Progress" with ChartUp icon
- **Cards**:

| Card                 | Source        | Notes                                                 |
| -------------------- | ------------- | ----------------------------------------------------- |
| Stats Row            | Analytics tab | 3-col row: StreakFire + Achievements + Progress Chart |
| Achievement Showcase | Analytics tab | 1-col. Last 3 earned achievements                     |
| Leaderboard          | Analytics tab | 2-col (lazy loaded). Weekly leaderboard               |
| Mastery Heatmap      | Analytics tab | Full-width (lazy loaded). Topics × Bloom levels       |
| Competition          | Today tab     | 1-col. Weekly leaderboard with subject tabs           |
| Reward Chest         | Shared        | 1-col. Chest panel                                    |

### Zone 7: Tools & Extras

- **Section heading**: "Tools" with Settings icon
- **Cards**:

| Card                | Source       | Notes                                       |
| ------------------- | ------------ | ------------------------------------------- |
| Focus Timer         | Shared       | Full-width. Pomodoro timer                  |
| Offline Packs       | Practice tab | Full-width. Offline study pack manager      |
| Quiz Start          | Practice tab | Full-width. Subject selector + Start button |
| Pronunciation Chart | Today tab    | Full-width. Pronunciation scores line chart |
| Word of the Day     | Today tab    | 1-col. Dictionary word + audio              |
| Stories Progress    | Today tab    | 1-col. Keep-reading tracker                 |

### Zone 8: Anonymous upsell

- Only shown when `isAnonymous`
- Same as existing `AnonymousUpsell` — sign-in CTA

---

## 3. Files to Create / Delete / Modify

### Create

- `src/components/dashboard/dashboard-view.tsx` — the single unified scroll component (replaces today-tab, practice-tab, analytics-tab)

### Delete

- `src/components/dashboard/navigation/tab-nav.tsx`
- `src/components/dashboard/types.ts`
- `src/components/dashboard/scroll-ambient.tsx`

### Modify

- `src/components/dashboard/dashboard-client.tsx` — remove tab state, remove QuizView dynamic import, simplify loading
- `src/components/dashboard/dashboard-content.tsx` — remove tab routing, remove NoiseOverlay, use DashboardView instead of tab components, remove PullToRefresh
- `src/components/dashboard/dashboard-hero.tsx` — merge with countdown info, add stronger visual presence
- `src/components/dashboard/countdown-header.tsx` — refactor into the merged hero; remove sentinel/compact behavior (single scroll = always visible)
- `src/components/dashboard/daily-challenge-card.tsx` — refresh styling to match landing page look (warmer, cleaner)
- `src/components/dashboard/next-best-action.tsx` — refresh card styling
- `src/components/dashboard/streak-card.tsx` — refresh card styling
- `src/components/dashboard/upcoming-exam-card.tsx` — refresh card styling
- `src/components/dashboard/quiz-start-card.tsx` — refresh card styling

### Other changes

- Remove dynamic imports for TodayTab/PracticeTab/AnalyticsTab from dashboard-content.tsx
- Update all imports

---

## 4. Visual Design Tokens

- **Card radius**: `rounded-card` (matching landing page)
- **Card shadow**: `shadow-level-1` (resting), `shadow-level-2` (hero)
- **Card hover**: `hover:bg-muted/30` with `transition-[background-color] duration-200`
- **Card border**: `border border-border/30` — very subtle
- **Section headings**: `font-extrabold text-(--fs-heading-3)` with matching icon, `text-muted-foreground` subheading optional
- **Empty states**: Grey card with dashed border, icon, "Nothing here yet" copy
- **Dark mode**: All cards have `dark:` variants with `dark:bg-system-surface-secondary` and adjusted borders

---

## 5. Responsive Behavior

- **Mobile (single column)**: All cards stack vertically, full-width
- **Tablet (2 columns)**: Cards span 1-2 columns based on priority
- **Desktop (3 columns)**: Cards span 1-3 columns based on priority
- Grid pattern: `grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-5`

---

## 6. Priority Heuristic for Card Span

| Priority         | Span (desktop)                      | Criteria                     |
| ---------------- | ----------------------------------- | ---------------------------- |
| Hero             | Full (3-col)                        | Always at top                |
| Daily Challenge  | 2-col                               | Most actionable daily item   |
| Next Best Action | 2-col                               | AI-suggested, high value     |
| Today's Focus    | 2-col                               | Session-oriented             |
| Weak Topics      | 2-col                               | Improvement-driven           |
| Stats Row        | Full (3-col)                        | Three sub-cards side by side |
| Learning Map     | Full (3-col)                        | Needs horizontal space       |
| Mastery Heatmap  | Full (3-col)                        | Needs horizontal space       |
| Focus Timer      | Full (2-col tablet / 3-col desktop) | Broad tool                   |
| Offline Packs    | Full                                | Broad tool                   |
| Quiz Start       | Full                                | Bottom CTA                   |
| Everything else  | 1-col default                       | Lower priority               |

---

## 7. Implementation Order

1. Create `dashboard-view.tsx` — assemble all cards in correct order, deduplicated
2. Refresh `dashboard-client.tsx` — remove tab state, simplify
3. Refresh `dashboard-content.tsx` — remove tab routing, ambient cleanup
4. Delete `tab-nav.tsx`, `types.ts`, `scroll-ambient.tsx`
5. Merge hero banner (dashboard-hero + countdown-header)
6. Refresh card styling for all remaining cards
7. TypeScript check + test run
