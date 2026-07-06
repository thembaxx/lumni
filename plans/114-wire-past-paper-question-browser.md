# Plan 114: Wire past paper question browser page

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d3446bd7..HEAD -- src/components/practice/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (all building blocks exist; only the page shell is missing)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `d3446bd7`, 2026-07-06

## Why this matters

The past paper question extraction pipeline is complete: questions are
classified, embedded, and stored as structured `PastPaperQuestion` objects.
Three well-factored UI components exist (`past-question-list.tsx`,
`past-question-filters.tsx`, `past-question-card.tsx`). But there is no route
that composes them — students cannot browse past questions by topic and year
outside of quiz flow. This is a high-visibility UX gap.

## Current state

Existing components in `src/components/practice/`:

- `past-question-list.tsx` — renders a scrollable list of question cards
- `past-question-filters.tsx` — subject, topic, year, type filter controls
- `past-question-card.tsx` — individual question card with metadata

Existing API:

- `GET /api/exam-papers/questions` — supports `subject`, `topic`, `year`,
  `type` query parameters; returns `PastPaperQuestion[]`

No page at `src/app/[locale]/practice/questions/`.

The repo convention for listing pages: see `src/app/[locale]/past-papers/page.tsx`
for the pattern — `"use client"`, TanStack Query, filter state in URL search
params, `<PageContainer>` wrapper.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Typecheck | `pnpm run typecheck`     | exit 0              |
| Tests     | `pnpm run test`          | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/app/[locale]/practice/questions/page.tsx` — new page route
- `src/app/[locale]/practice/questions/practice-questions-client.tsx` — client component

**Out of scope**:

- Changes to existing `past-question-*` components
- Changes to the API route
- Navigation sidebar entry (add separately if needed)

## Steps

### Step 1: Create the client component

Create `src/app/[locale]/practice/questions/practice-questions-client.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PastQuestionFilters } from "@/components/practice/past-question-filters";
import { PastQuestionList } from "@/components/practice/past-question-list";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { PastPaperQuestion } from "@/types/exam";

export function PracticeQuestionsClient() {
  const [filters, setFilters] = useState({
    subject: "",
    topic: "",
    year: "",
    type: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["past-questions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.subject) params.set("subject", filters.subject);
      if (filters.topic) params.set("topic", filters.topic);
      if (filters.year) params.set("year", filters.year);
      if (filters.type) params.set("type", filters.type);
      return apiFetch<PastPaperQuestion[]>(`/api/exam-papers/questions?${params}`);
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="flex flex-col gap-6">
      <PastQuestionFilters value={filters} onChange={setFilters} />
      <PastQuestionList questions={data ?? []} isLoading={isLoading} />
    </div>
  );
}
```

### Step 2: Create the page

Create `src/app/[locale]/practice/questions/page.tsx`:

```tsx
import { PageContainer } from "@/components/shared/page-container";
import { PracticeQuestionsClient } from "./practice-questions-client";

export default function PracticeQuestionsPage() {
  return (
    <PageContainer>
      <PracticeQuestionsClient />
    </PageContainer>
  );
}
```

### Step 3: Verify

```bash
pnpm exec oxlint --fix
pnpm run typecheck
pnpm run test
```

All pass with 0 errors.

## Test plan

- No new test file required (the component is a thin composition of existing
  components with a TanStack Query call)
- If tests exist for `past-question-list` or `past-question-filters`, verify
  they still pass

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Navigate to `/practice/questions` — filters render, questions load
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `past-question-filters` component has a different API than shown above
  — read its current props before writing PracticeQuestionsClient
- The `GET /api/exam-papers/questions` response shape differs — check the
  route handler before writing the query
- A `/practice/questions` route already exists — skip plan

## Maintenance notes

- When the practice hub navigation is built, add a link from
  `/practice` to `/practice/questions`
- The filters component may need URL search param sync for shareable filter
  state — defer if not already implemented
