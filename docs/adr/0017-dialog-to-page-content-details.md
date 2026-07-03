# ADR-0017: Dialog-to-Page Extraction — Content Details

**Status:** Accepted  
**Date:** 2026-07-03  
**Extends:** ADR-0014, ADR-0016

## Context

ADR-0014 and ADR-0016 established and refined the dialog-to-page rule of thumb. However, a post-hoc audit (Session grill) identified three remaining page-content dialogs that satisfy the extraction criteria but were not yet captured:

1. **Element detail modal** (`src/components/tools/science/element-detail-modal.tsx`) — rich scrollable content (properties, electron shell visual, category, facts)
2. **Exam detail dialog** (`src/components/tools/communication/exam-detail-dialog.tsx`) — countdown timer, subject details, practice CTAs
3. **Student detail dialog** (`src/components/teacher/student-detail-dialog.tsx`) — full performance profile, weak topics, observation timeline

All three are triggered from a single parent component (no multi-point duplication), but each contains complex, scrollable, independently meaningful content that users may want to bookmark, share, or return to.

### Criteria check

| Candidate | Multi-step / rich content | Full-screen | Data-fetching/loading | Multiple triggers | Verdict |
|---|---|---|---|---|---|
| Element detail | Yes — scrollable facts, shell viz, properties | No | No | No (1 trigger: periodic table) | Extract |
| Exam detail | Yes — countdown, slots, practice CTAs | No | Yes | No (1 trigger: exam calendar) | Extract |
| Student detail | Yes — scores, weak topics, timeline | No | Yes | No (1 trigger: teacher roster) | Extract |

All three are **rich content** (criterion 1 from ADR-0014). Two have data-fetching states. None are full-screen, but they are dense enough to benefit from their own URL.

## Decision

Extract the three content-detail dialogs into standalone routes. Follow the same migration pattern established in ADR-0016.

### Extracted routes

| Old component | New route | Category |
|---|---|---|
| `element-detail-modal.tsx` | `/tools/periodic/[symbol]` | Tools |
| `exam-detail-dialog.tsx` | `/exam-dates/[id]` | Practice |
| `student-detail-dialog.tsx` | `/teacher/students/[id]` | Teacher |

### Migration pattern (per ADR-0016)

```
1. Create route page at src/app/[locale]/<route>/page.tsx
2. Copy state/rendering logic from dialog into page component
3. Replace Dialog wrapper with PageContainer + inline layout
4. Replace open/onOpenChange/onSuccess with router.push + searchParams
5. Wire trigger points to use next/link instead of useState toggle
6. Delete old dialog component
7. Verify: typecheck, lint, test
```

### Route details

**`/tools/periodic/[symbol]`** — Public route, no auth required. The periodic table already has subject-matter educational content. Accepts `symbol` param (e.g., `Fe`, `H`, `U`). Shows "Element not found" state on invalid symbol.

**`/exam-dates/[id]`** — Auth-gated (user must be signed in). The exam-detail dialog currently shows countdown timer, subject metadata, date/time/duration, and a practice CTA. The page version can additionally show related past papers and a "Add to planner" action.

**`/teacher/students/[id]`** — Auth-gated + teacher-role-gated. Currently shows overall performance (MasteryBadge + Progress), weak topics (Badge list), ObservationTimeline. The page version can additionally include trend charts and compare-to-class metrics.

### Trigger point updates

| Current trigger | New trigger |
|---|---|
| Periodic table `onElementClick` → setState + open dialog | `<Link href="/tools/periodic/{symbol}">` |
| Exam calendar `onSlotClick` → setState + open dialog | `<Link href="/exam-dates/{id}">` |
| Teacher roster `onStudentClick` → setState + open dialog | `<Link href="/teacher/students/{id}">` |

### Sidebar additions

- No new sidebar items for any of the three routes — they are navigated from their parent pages, not from the sidebar nav. All three parent pages (`/tools`, `/exam-dates`, `/teacher`) already have sidebar entries.

## Consequences

**Positive:**

- Element detail is bookmarkable and shareable — students can link classmates to a specific element
- Exam detail gets browser-history-aware countdowns and can host related resources (past papers, planner integration)
- Student detail page supports deep linking from reports, emails, or parent dashboards
- All three benefit from View Transition enter/exit animations
- Removes 3 dialog components (~200 lines total), reduces modal stack complexity

**Negative:**

- Adds 3 routes to the page count (~52 → ~55)
- Teacher route needs role-based access control (already exists in the teacher layout)
- Element detail route needs a fallback page for invalid symbols
- Exam detail route needs the exam-dates data available server-side or via React Query (currently fetched client-side inside the dialog)

## Glossary

| Term | Definition |
|---|---|
| Content-detail dialog | A dialog that shows detailed information about a specific entity (element, exam, student). Distinct from action dialogs (forms, confirmations) and celebration dialogs (transient overlays). |
| Parent page | The page from which a content-detail dialog is triggered. For all three candidates, there is exactly one parent page per dialog. |
| Deep-linkable | Content that can be reached via a direct URL, enabling bookmarking, sharing, and browser history navigation. |

## Reference

- ADR-0014: Dialog-to-Page Extraction + Instant Navigation (2026-06-26)
- ADR-0016: Dialog-to-Page Expansion — Auth + Multi-Phase Flows (2026-06-28)
- Session grill audit: Identified 3 remaining page-content dialogs
