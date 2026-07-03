# Past Paper Question Browser — Design Spec

**Date**: 2026-07-03
**Status**: Draft

## Overview

A standalone page at `/practice/questions` (linked from the practice hub) that lets students browse individual past paper questions by topic, year, and difficulty — with a toggle to switch between **browse mode** (answers visible) and **practice mode** (answer hidden, attempt, reveal).

The extraction pipeline already creates `PastPaperQuestion` objects with topic/subtopic metadata and embeddings. The API at `GET /api/exam-papers/questions` supports subject, topic, year, and type filters. This feature provides the student-facing UI that is currently missing.

## Route & Entry

- **Route**: `/practice/questions`
- **Entry**: New card in the `/practice` hub (CategoryOverview): "Question Bank" with a `Search01Icon` icon and description "Browse past paper questions by topic"
- **Locale support**: Standard `[locale]` prefix through normal Next.js routing

## Layout

```
┌──────────────────────────────────────────────┐
│  PageContainer                               │
│  ┌───────────┬──────────────────────────────┐ │
│  │ Filters   │  Header bar                  │ │
│  │ 260px     │  "45 questions found"        │ │
│  │ (sticky)  │  [Physical Sciences x] [2024]│ │
│  │           │  [Clear all]                 │ │
│  │ Subject   ├──────────────────────────────┤ │
│  │ selector  │  Question list (scrollable)  │ │
│  │           │  ┌────────────────────────┐  │ │
│  │ Topic     │  │ Q: Balance the eq...  │  │ │
│  │ dropdown  │  │ 3 marks · 2024 P1     │  │ │
│  │           │  │ [Practice]            │  │ │
│  │ Year      │  └────────────────────────┘  │ │
│  │ range     │  ┌────────────────────────┐  │ │
│  │           │  │ Q: Calculate the pH... │  │ │
│  │ Diff.     │  │ 5 marks · 2023 P2     │  │ │
│  │ tier      │  │ [Practice]            │  │ │
│  │           │  └────────────────────────┘  │ │
│  │           │  [Load more]                  │ │
│  └───────────┴──────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

### Desktop

- **Filters panel**: Left sidebar, `w-64`, sticky, scrolls independently. Contains:
  - **Subject**: Dropdown/select populated from the subject allowlist
  - **Topic**: Cascading dropdown — populated after subject is selected. Fetched from metadata or filtered from question data
  - **Year**: Optional year range (start/end year inputs or preset ranges: "Last 3 years", "All years")
  - **Difficulty tier**: Optional toggle — "Easy", "Medium", "Hard"
- **Question list**: Right area, scrollable. Shows compact question cards.

### Mobile

- Filters collapsed behind a sticky top bar with a "Filters" button
- Tapping "Filters" opens a slide-down panel (accordion-style) or a bottom sheet
- Question list takes full width

## Components

### New

| Component             | File                                                                                           | Responsibility                                                |
| --------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `PastQuestionBrowser` | `src/app/[locale]/practice/questions/page.tsx` (server) + `past-question-browser.tsx` (client) | Page orchestrator, wires URL params to query                  |
| `PastQuestionFilters` | `src/components/practice/past-question-filters.tsx`                                            | Filter controls: subject, topic, year, difficulty             |
| `PastQuestionList`    | `src/components/practice/past-question-list.tsx`                                               | Result list with pagination, active chip display, empty state |
| `PastQuestionCard`    | `src/components/practice/past-question-card.tsx`                                               | Compact question display with browse/practice toggle          |
| `usePastQuestions`    | `src/hooks/use-past-questions.ts`                                                              | Filter state + React Query + pagination + URL sync            |

### Reused

- `QuestionCard` subcomponents for question text rendering and feedback display
- `QuestionCardFeedback` for practice mode grading results
- `VerifiedByPill` / `SourceAttributionPill` for source attribution

## Data Flow

```
URL: /practice/questions?subject=physical-sciences&topic=stoichiometry&year=2024

  usePastQuestions hook
    │
    ├── Parses URL search params (via useSearchParams)
    ├── Builds query key: ["past-questions", subject, topic, year, difficulty, page]
    ├── Calls GET /api/exam-papers/questions?subject=X&topic=Y&year=Z&difficulty=D&limit=20&offset=N
    │
    └── Returns { questions, total, isLoading, error, loadMore }
         questions: PastPaperQuestion[]
         total: number (from response or estimate)
         loadMore: () => void (increments offset, append mode)
```

- React Query with `keepPreviousData: true` for smooth pagination
- 5-minute stale time (past paper data is static)
- URL params are the source of truth — filters write to URL via `useRouter.replace`

## Interaction Modes

### Browse mode (default)

- Question text + answer + explanation shown immediately
- Each card shows: question text (truncated), marks, year, paper number
- Click to expand full question with answer/explanation

### Practice mode

- User clicks "Practice" button on a card
- Answer/explanation section is hidden/blurred
- An input area or "Show Answer" button appears
- User can type an answer or click "Reveal"
- On reveal: shows the correct answer, overlays `QuestionCardFeedback` with scoring
- Score is local-only (not persisted to competency tracking — that's for the quiz engine)
- User exits practice mode back to browse view

## API Layer

The existing `GET /api/exam-papers/questions` endpoint supports:

| Param     | Type   | Required | Notes                                               |
| --------- | ------ | -------- | --------------------------------------------------- |
| `subject` | string | Yes      | Matches subject allowlist                           |
| `topic`   | string | Yes      | Topic within subject                                |
| `year`    | int    | No       | Single year filter                                  |
| `type`    | string | No       | Question type filter (maps to `questionType` field) |
| `limit`   | int    | No       | Default 20, max 50                                  |
| `offset`  | int    | No       | Default 0                                           |

The existing endpoint reads from Appwrite `past_paper_questions` collection. No API changes needed.

**Difficulty tier** is computed client-side from `marks` or `bloomLevel` on `PastPaperQuestion`:

- `bloomLevel` in `{"Remember", "Understand"}` or `marks <= 2` → Easy
- `bloomLevel` in `{"Apply", "Analyze"}` or `marks 3-5` → Medium
- `bloomLevel` in `{"Evaluate", "Create"}` or `marks >= 6` → Hard
- Filtering by difficulty is client-side only for the MVP (no new API param)

## Mobile Behavior

- **Filter panel**: Collapsible. A sticky "Filters" button at the top toggles the filter accordion. On very small screens (< 400px), a bottom sheet instead.
- **Question cards**: Full width, slightly larger touch targets (min-h-12 for buttons)
- **Pagination**: "Load more" button at bottom, or infinite scroll on mobile if preferred

## States

| State                 | Behaviour                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| **Initial load**      | No subject selected → show "Select a subject and topic to browse past paper questions" placeholder |
| **Loading**           | Skeleton cards (3-4 pulsing rectangles)                                                            |
| **Empty**             | "No questions found for these filters. Try adjusting your topic or year." + illustration           |
| **Error**             | Toast notification "Failed to load questions". Filters preserved. Retry button.                    |
| **Load more loading** | Spinner below last card, existing cards remain visible                                             |

## Testing

- `usePastQuestions` hook: filter building, URL sync, pagination
- `PastQuestionCard`: browse vs practice mode toggle, answer reveal
- `PastQuestionFilters`: filter change triggers URL update
- Integration: full flow with mock API response

## Future Considerations (not in scope)

- **Save/bookmark questions** for later review
- **Track practice attempts** per question (would need a new Dexie table)
- **Export question set** as PDF
- **AI-similar questions** — "Show me more questions like this"
- **Competency integration** — route practice results into competency tracking
