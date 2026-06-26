# ADR-0014: Dialog-to-Page Extraction + Instant Navigation

**Status:** Accepted  
**Date:** 2026-06-26  
**Deprecates:** Full-screen inline dialogs for page-like content

## Context

The codebase historically used dialogs for full-screen experiences that behave like standalone pages: quiz flows, onboarding wizards, PDF readers, exam paper viewers, lesson browsers, and referral panels. While the `Dialog` primitive was convenient for quick overlay entry, these components shared several problems:

- **No deep linking**: Users couldn't share or bookmark URLs for these experiences
- **No browser history**: Back button behaviour was unpredictable or broken
- **No Instant Navigation**: Dialog open/close couldn't participate in View Transition animations
- **No correct URL in address bar**: User lost spatial awareness of where they were in the app
- **Inconsistent UX**: Some page-like content was in dialogs, some in sheets, some on real routes — no clear rule for which was which

Meanwhile, the app already had a mature Instant Navigation system (`useNavigationDirection` wrapping native `startViewTransition()` at 23+ call sites) with directional slide animations, and a navigation sidebar overhaul (Session 31) that replaced a 64px icon column with full categorized navigation.

The gap: page-like dialogs couldn't benefit from this infrastructure.

## Decision

Extract all page-content dialogs into standalone routes. Keep only tool/utility dialogs (confirmations, auth flows, study-group actions, pickers, celebrations, uploads) as inline overlays.

### Rule of thumb

A dialog becomes a route when it:

1. **Contains multi-step or rich content** that a user would want to bookmark or share
2. **Is full-screen (`h-dvh w-screen max-w-none`)** with no visible parent page
3. **Has data-fetching or loading states** that would benefit from View Transition enter/exit
4. **Is triggered from multiple locations** (sidebar, cards, dashboard sections)

A dialog stays as a dialog when it:

1. **Is contextual to the current page** (e.g., "Create study group" while on the study groups page)
2. **Is ephemeral** (celebrations, confirmations, toasts)
3. **Is a quick-action form** (add exam to planner, invite parent)
4. **Is an auth overlay** (magic link, OTP) that appears before the app shell is ready

### Extracted routes

| Old component                | New route                    | Category |
| ---------------------------- | ---------------------------- | -------- |
| `daily-challenge-dialog.tsx` | `/quiz?mode=bolt`            | Learn    |
| `onboarding-wizard.tsx`      | `/onboarding`                | (no nav) |
| `pdf-viewer.tsx`             | `/exam/[id]/pdf`             | Practice |
| `smart-view-dialog.tsx`      | `/past-papers/[id]`          | Practice |
| `lesson-sheet.tsx`           | `/lessons`                   | Learn    |
| `referral-sheet.tsx`         | `/settings/referral`         | Tools    |
| `celebration-overlay.tsx`    | (inlined into `/onboarding`) | —        |

### Navigation architecture

**Two-level hierarchy with real category pages:**

| Depth | Examples                                     |
| ----- | -------------------------------------------- |
| 0     | `/`, `/dashboard`                            |
| 1     | `/learn`, `/practice`, `/tools`, `/progress` |
| 2     | `/quiz`, `/lessons`, `/exams`, `/chat`       |

Category pages (`/learn`, `/practice`, `/tools`, `/progress`) are real routes with overview content. Depth 1 vs 2 drives View Transition directional animations (forward = slide in from right, back = slide in from left).

**Sidebar changes:**

- Add "Lessons" to Learn category
- Add `/exam/[id]/pdf` under Practice (no sidebar item — navigated from exam page)
- Add `/past-papers/[id]` under Practice (no sidebar item — navigated from past papers)
- Add "Referral" to Tools category
- New routes added to `getNavHierarchy()` for depth tracking

### Instant Navigation

All extracted routes use `useNavigationDirection` for View-Transition-powered navigation. Category pages get `viewTransitionName` CSS properties for shared-element animations where beneficial. The existing infrastructure (native `startViewTransition()`, direction-aware slides, crossfade default) is used as-is.

### Removal scope

- `lesson-sheet.tsx` — removed entirely; dashboard card navigates to `/lessons`
- `referral-sheet.tsx` — removed entirely; settings link navigates to `/settings/referral`
- `daily-challenge-dialog.tsx` — removed; Bolt runs inside `/quiz?mode=bolt`
- `onboarding-wizard.tsx` — removed; content extracted into `/onboarding`
- `pdf-viewer.tsx` — removed; content extracted into `/exam/[id]/pdf`
- `smart-view-dialog.tsx` — removed; content extracted into `/past-papers/[id]`

## Consequences

**Positive:**

- Every page-like experience has a URL — bookmarkable, shareable, history-aware
- Back button works correctly for all flows
- View Transitions animate all page entries and exits (not just dialog open/close)
- Consistent mental model: dialogs = tools, pages = content
- Category pages at `/learn`, `/practice` etc. give users an overview hub
- Bolt celebration is inline on `/quiz?mode=bolt` (no separate dialog overlay)

**Negative:**

- Some routes (`/exam/[id]/pdf`) add to the total page count (~45 → ~52)
- Category pages require content — empty overviews would be worse than no pages
- Migrating dialogs means extracting state management to URL params or client state
- Onboarding route needs special auth handling (no guard, redirect when done)
- Lesson sheet removal means one less quick-access method from dashboard

## Implementation plan

See `docs/plans/0014-implementation.md` for the phased task breakdown.
