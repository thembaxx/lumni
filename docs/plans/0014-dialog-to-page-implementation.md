# Implementation Plan: Dialog-to-Page Extraction + Instant Navigation

**ADR:** 0014  
**Date:** 2026-06-26  
**Total phases:** 5

---

## Phase 0: Audit & Discovery (prerequisite)

Before coding, verify the complete list of dialog triggers and consumer components.

- [ ] Find ALL places that open each target dialog (grep for component imports, `open={`, `onOpenChange`, `onClose`)
- [ ] Map which dashboard cards/buttons trigger LessonSheet, ReferralSheet, daily-challenge-dialog, pdf-viewer, smart-view-dialog, onboarding-wizard
- [ ] Verify no dead imports remain after each removal

---

## Phase 1: Navigation Infrastructure

**Goal:** Create category pages, update nav config, expand hierarchy, remove sheet triggers.

### 1.1 Nav config updates (`src/lib/navigation/config.ts`)

- [ ] Add new items:

  ```ts
  // Learn
  { id: "lessons", label: "Lessons", icon: BookOpen01Icon, route: "/lessons" },

  // Practice
  // PDF viewer and smart view are navigated from exam/past-paper pages, not sidebar

  // Tools
  { id: "referral", label: "Referral", icon: ShareIcon, route: "/settings/referral" },
  ```

- [ ] Expand `getNavHierarchy()` to two levels:
  ```ts
  export function getNavHierarchy(): Record<string, number> {
    return {
      "/": 0,
      "/dashboard": 0,
      "/learn": 1,
      "/practice": 1,
      "/tools": 1,
      "/progress": 1,
      // All sub-pages default to depth 2 via 'startsWith' matching in consumer
    };
  }
  ```
- [ ] Update `getRouteLabel()` to match new routes (already uses `startsWith`, should work)

### 1.2 Category pages

Create overview pages for each category:

- [ ] `src/app/[locale]/learn/page.tsx` — overview of Learn items (quiz, flashcards, problems, stories, pronunciations, lessons). Quick-start cards linking to each.
- [ ] `src/app/[locale]/practice/page.tsx` — overview of Practice items (exams, past papers, exam dates, review). Stats summary.
- [ ] `src/app/[locale]/tools/page.tsx` — overview of Tools items (chat, solve, study guide, dictionary, search, upload, referral).
- [ ] `src/app/[locale]/progress/page.tsx` — overview of Progress items (study plan, bookmarks, settings). Dashboard-style summary.
- [ ] Each category page uses `<PageContainer>`, has `viewTransitionName` for shared-element morphing
- [ ] Loading states: `<PageSkeleton>` in `loading.tsx` for each

### 1.3 Sidebar category navigation

- [ ] Sidebar category headers (Learn, Practice, Tools, Progress) become clickable links to `/learn`, `/practice`, `/tools`, `/progress`
- [ ] Active state highlights parent category when on a sub-page (e.g., `/quiz` → "Learn" highlighted)

### 1.4 Remove sheet triggers

- [ ] `lesson-sheet.tsx`: Find all triggers (likely dashboard card, maybe elsewhere). Replace navigate to `/lessons` using `useNavigationDirection().push()`
- [ ] Delete `lesson-sheet.tsx`
- [ ] Delete `referral-sheet.tsx`
- [ ] Find all referral sheet triggers (likely settings page, dashboard widget). Replace with link to `/settings/referral`

### 1.5 Instant Navigation coverage

- [ ] Audit all new routes — ensure they use `useNavigationDirection` for navigation actions
- [ ] Add `viewTransitionName` to category page containers for shared-element morph transitions
- [ ] Verify e2e navigation tests cover new routes

---

## Phase 2: Onboarding Wizard → `/onboarding`

**Goal:** Extract 4-step wizard from dialog to standalone route.

### 2.1 Create `/onboarding` route

- [ ] `src/app/[locale]/onboarding/page.tsx` — client component, wraps `OnboardingPage` content
- [ ] `src/app/[locale]/onboarding/layout.tsx` — minimal layout (no sidebar, no top/bottom nav, no `PageContainer`). Outside app shell.
- [ ] Auth guard: check if onboarding already completed (`localStorage` or Dexie `onboardingState` table) → redirect to `/dashboard`
- [ ] No auth _required_ — accessible pre-login

### 2.2 Extract content

- [ ] Move step rendering logic from `onboarding-wizard.tsx` into `src/app/[locale]/onboarding/page.tsx`
- [ ] Keep step state as React state + URL search params (`?step=1`) for direct linking
- [ ] Celebration overlay (`celebration-overlay.tsx`): inline as final step phase (auto-advance to `/dashboard` after 800ms or user click)
- [ ] Remove `onboarding-wizard.tsx`
- [ ] Remove `celebration-overlay.tsx`

### 2.3 Trigger replacement

- [ ] Root layout or auth context: check onboarding state → redirect to `/onboarding` instead of opening dialog
- [ ] Ensure `/onboarding` is excluded from View Transition animations (fresh start experience — no slide-in)

---

## Phase 3: Bolt → `/quiz?mode=bolt`

**Goal:** Run daily challenge inside the existing quiz page with a minimal mode parameter.

### 3.1 /quiz page updates

- [ ] Detect `mode=bolt` query param in `quiz-view.tsx` or `quiz-page.tsx`
- [ ] When `mode=bolt`:
  - Question source: single Bolt-style AI question (not a full quiz set)
  - UI: sticky bottom bar (from `daily-challenge-dialog.tsx`), minimal header
  - No close button, no exit
  - Same-page celebration phase after answering (confetti, XP, streak, "Finish" button)
  - "Finish" navigates to `/dashboard` via `startViewTransition`
- [ ] Bolt question source: either reuse existing `POST /api/engine/generate` or the Bolt-specific generation endpoint
- [ ] Timer: daily-challenge uses a short timer per question — preserve in bolt mode

### 3.2 Extract celebration into quiz page

- [ ] Move celebration UI from `daily-challenge-dialog.tsx` into a shared `BoltCelebration` component rendered inside the quiz page when `mode=bolt && phase === "celebrating"`
- [ ] Celebration shows XP, streak, confetti, "Practice more {subject}" link
- [ ] Auto-advance option: 800ms timer then "Finish" CTA

### 3.3 Remove old dialog

- [ ] Delete `daily-challenge-dialog.tsx`
- [ ] Delete `challenge-dialog.tsx` (wrapper) — check if used elsewhere
- [ ] Delete `daily-challenge-dialog.tsx` (the full-screen wrapper)
- [ ] Update dashboard `DailyChallengeCard` to navigate: `push("/quiz?mode=bolt")`

---

## Phase 4: PDF Viewer + Smart View

**Goal:** Extract PDF viewer and exam paper viewer into dedicated routes.

### 4.1 `/exam/[id]/pdf` route

- [ ] `src/app/[locale]/exam/[id]/pdf/page.tsx` — client component wrapping `PdfViewer` component
- [ ] Load exam data to get PDF URL (from existing exam data or Appwrite)
- [ ] Render PDF with existing toolbar (page nav, zoom, download, fullscreen toggle)
- [ ] Use existing `PdfViewer` component (move from `src/components/dashboard/practice/` to `src/components/exam/`)
- [ ] Remove `pdf-viewer.tsx` dialog trigger from `ExamCard` — replace with `push("/exam/[id]/pdf")`
- [ ] Loading state: skeleton matching PDF viewer layout

### 4.2 `/past-papers/[id]` route

- [ ] `src/app/[locale]/past-papers/[id]/page.tsx` — client component wrapping `SmartViewDialog` content
- [ ] Load past paper markdown from API (existing endpoint)
- [ ] Render with `MarkdownRenderer` inside `<PageContainer>`
- [ ] Keep `FullscreenDialog` component as a utility wrapper if still needed elsewhere, or remove
- [ ] Update trigger in `ExamCard` / past-paper list: `push("/past-papers/[id]")`
- [ ] Loading state: skeleton

### 4.3 Remove old components

- [ ] Delete `smart-view-dialog.tsx`
- [ ] Delete `fullscreen-dialog.tsx` — check consumers first

---

## Phase 5: Lessons + Referral

**Goal:** Create standalone pages for lessons browser and referral panel.

### 5.1 `/lessons` route

- [ ] `src/app/[locale]/lessons/page.tsx` — client component
- [ ] Content: subject filter, search, lesson list (same as current LessonSheet body)
- [ ] Clicking a lesson card navigates to lesson detail (existing inline dialog or new `/lessons/[id]` route)
- [ ] Uses `<PageContainer>`, has proper loading state
- [ ] Nav sidebar: "Lessons" in Learn category

### 5.2 `/settings/referral` route

- [ ] `src/app/[locale]/settings/referral/page.tsx` — client component
- [ ] Content: referral code display, copy button, share button, QR code, "how it works" instructions, stats
- [ ] Same content as current ReferralSheet (no new design needed)
- [ ] Settings nav already has Settings page — referral is a sub-route, accessible from Settings tab or directly

### 5.3 Nav sidebar integration

- [ ] Add "Lessons" to Learn nav category
- [ ] Add "Referral" to Tools nav category (icon: `ShareIcon` or similar)
- [ ] Verify sidebar depth/active highlighting works for sub-routes (`/settings/referral` highlights Settings)

---

## Verification

After each phase:

```bash
pnpm run typecheck      # 0 errors
pnpm exec biome check   # 0 errors on changed files
pnpm run test           # no regressions
```

Final verification:

- Each new route loads correctly (manual check)
- View Transitions animate all nav entries (check `data-vt-direction` in DOM)
- No dead imports remain from removed dialog components
- E2E navigation tests pass
- Back/forward browser navigation works correctly on all new routes

---

## Files to delete (cumulative)

| Phase | Files                                                                            |
| ----- | -------------------------------------------------------------------------------- |
| 1     | `lesson-sheet.tsx`, `referral-sheet.tsx`                                         |
| 2     | `onboarding-wizard.tsx`, `celebration-overlay.tsx`                               |
| 3     | `daily-challenge-dialog.tsx`, `challenge-dialog.tsx`                             |
| 4     | `pdf-viewer.tsx`, `smart-view-dialog.tsx`, `fullscreen-dialog.tsx` (if orphaned) |

## Files to create

| Phase | Files                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------- |
| 1     | `/learn/page.tsx`, `/practice/page.tsx`, `/tools/page.tsx`, `/progress/page.tsx`, loading.tsx per category |
| 2     | `/onboarding/page.tsx`, `/onboarding/layout.tsx`                                                           |
| 3     | — (modifies existing `/quiz/page.tsx` and `quiz-view.tsx`)                                                 |
| 4     | `/exam/[id]/pdf/page.tsx`, `/past-papers/[id]/page.tsx`                                                    |
| 5     | `/lessons/page.tsx`, `/settings/referral/page.tsx`                                                         |

## Risk areas

- **Onboarding auth**: `/onboarding` must work pre-auth (no auth guard) but redirect if already completed. Race condition with session check on first visit.
- **Bolt state**: `mode=bolt` on the quiz page introduces a branched path. Must not break regular quiz flow. Keep bolt changes minimal and feature-flagged if needed.
- **Category page content**: Empty /learn page is worse than no page. Provide meaningful overview content (recent activity, quick-start cards, stats summary).
- **View Transition conflicts**: Category pages with `viewTransitionName` might conflict with page-level elements. Test morph animations thoroughly.
- **Sheet removal ripple**: LessonSheet and ReferralSheet may be imported in unexpected places. Grep thoroughly before deleting.
