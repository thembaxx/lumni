# Plan 115: Wire classroom join codes into the student experience

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d3446bd7..HEAD -- src/app/api/teacher/classroom/ src/app/api/student/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (fully additive — new route, no existing code changes)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `d3446bd7`, 2026-07-06

## Why this matters

Teachers can generate 6-character classroom join codes via
`POST /api/teacher/classroom/code`. The API route is fully implemented and
tested (`src/app/api/teacher/__tests__/classroom-code.test.ts`). But there is
no student-facing UI to enter a join code — teachers must know the student's
Appwrite user ID to link them, which does not scale.

Student join via code is the simplest path to teacher-student linking. It
directly enables gradebook, assignment tracking, and observation features.

## Current state

Backend:

- `POST /api/teacher/classroom/code` — generates a 6-character code with
  expiry and usage limits (tested)
- `POST /api/student/join` — accepts `{ code: string }`, links student to
  teacher (tested at `src/app/api/student/__tests__/join.test.ts`)

Frontend:

- No `/join` page or component exists
- No student-facing code entry flow exists

The repo convention for auth-gated pages: see `src/app/[locale]/settings/page.tsx`
for the pattern. Use `<PageContainer>`, `"use client"`, TanStack Query.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Typecheck | `pnpm run typecheck`     | exit 0              |
| Tests     | `pnpm run test`          | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/app/[locale]/join/page.tsx` — join page route
- `src/app/[locale]/join/join-client.tsx` — client component with code input

**Out of scope**:

- Teacher-side join code generation UI (already works via API)
- Navigation sidebar entry for the join page
- Bulk CSV import UI (separate feature)

## Steps

### Step 1: Create the join page

Create `src/app/[locale]/join/page.tsx`:

```tsx
import { PageContainer } from "@/components/shared/page-container";
import { JoinClient } from "./join-client";

export default function JoinPage() {
  return (
    <PageContainer>
      <JoinClient />
    </PageContainer>
  );
}
```

### Step 2: Create the client component

Create `src/app/[locale]/join/join-client.tsx`:

A simple component with:

1. A text input for the 6-character code (styled input, maxLength 6, uppercase)
2. A "Join Classroom" submit button
3. Loading state while submitting
4. Success state (redirects to dashboard or shows confirmation)
5. Error state (invalid code, expired code, already linked)

The component uses `useMutation` from TanStack Query to POST to
`/api/student/join` with `{ code }`.

On success: redirect to `/dashboard?joined=success` via
`router.push("/dashboard?joined=success")`.

Model the form after the sign-in form pattern at
`src/app/[locale]/auth/sign-in/sign-in-client.tsx` — shadcn input + Button.

### Step 3: Verify

```bash
pnpm exec oxlint --fix
pnpm run typecheck
pnpm run test
```

All pass with 0 errors.

## Test plan

- `src/app/[locale]/join/__tests__/join-client.test.tsx` — 3 tests:
  1. Renders code input and submit button
  2. Shows error state when code is invalid (mock API returns 400)
  3. Shows success state and redirects on valid code (mock API returns 200)
  - Pattern: use `vi.mock("@/lib/shared/api-fetch")` and
    `vi.mocked(apiFetch).mockRejectedValue/ResolvedValue`
  - Model after `src/app/api/student/__tests__/join.test.ts`

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] `pnpm run test` exits 0; new tests for JoinClient exist and pass
- [ ] Navigate to `/join` — code input renders, valid code links successfully
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `POST /api/student/join` endpoint has a different request/response shape
  — check `src/app/api/student/join/route.ts` before writing the mutation
- A `/join` route already exists — skip plan
- The route requires prior auth (student must be logged in) — add auth check
  via `getAuthenticatedUserId()` in the client component

## Maintenance notes

- Add the join page link to the settings/account section of the navigation
  sidebar config (`src/lib/navigation/config.ts`) after launch
- When teacher dashboard shows join codes, consider a QR code or copy-to-clipboard
  for easy sharing with students
- The join code has an expiry — the error message should indicate if the code
  has expired vs. simply invalid
