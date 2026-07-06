# Plan 113: Build school licensing onboarding UI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d3446bd7..HEAD -- src/lib/school/ src/app/api/school/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW (fully additive — new files, no existing code changes)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `d3446bd7`, 2026-07-06

## Why this matters

The school licensing backend is fully implemented and tested:

- `src/lib/school/service.ts` (343 lines) — school CRUD, membership management
- `src/lib/school/billing-service.ts` — Stripe checkout, subscription, billing
- `src/lib/school/pricing.ts` — tier configuration
- `src/app/api/school/` — 8 API routes (register, members, link-teacher,
  link-student, checkout, cancel, check-domain, billing)
- `src/lib/school/__tests__/service.test.ts` — 20 characterization tests

But there is zero frontend: no pages, no components, no hooks. This is the
bottleneck between the current state and B2B2C revenue.

## Current state

- No `src/app/[locale]/school/` directory exists
- No `src/hooks/use-school.ts` exists
- No `src/components/school/` directory exists
- The design spec at `docs/superpowers/2026-07-05-licensing-onboarding-flow.md`
  describes a 4-step wizard: (1) school details, (2) tier selection, (3)
  payment, (4) confirmation

The repo convention for pages: use `<PageContainer>` wrapper, `"use client"`
for interactive pages, TanStack Query for data fetching, shadcn components
for form elements. See `src/app/[locale]/settings/settings-client.tsx` as the
pattern for a multi-tab settings page.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Typecheck | `pnpm run typecheck`     | exit 0              |
| Tests     | `pnpm run test`          | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/app/[locale]/school/page.tsx` — school management page (route)
- `src/app/[locale]/school/school-client.tsx` — client component
- `src/hooks/use-school.ts` — data-fetching hook
- `src/components/school/school-onboarding-wizard.tsx` — 4-step wizard
- `src/components/school/tier-card.tsx` — tier selection card

**Out of scope**:

- Changes to any school API route or service (backend is complete)
- Stripe webhook handling
- PDF/email invoicing
- Multi-school admin dashboard

## Steps

### Step 1: Create the data-fetching hook

Create `src/hooks/use-school.ts` using the `createApiQuery` factory pattern
from `src/hooks/use-hook-factories.ts`.

Exported hooks:

- `useSchool()` — GET `/api/school/billing` (returns school info + billing)
- `useRegisterSchool()` — POST `/api/school/register` mutation
- `useCreateCheckout()` — POST `/api/school/checkout` mutation (returns
  Stripe checkout URL)

Use `createApiQuery` for the query hook. Use `createInvalidatingMutation` for
mutations (invalidates `["school"]` on success).

### Step 2: Create the tier card component

Create `src/components/school/tier-card.tsx`:

A card showing:

- Tier name (Free, Pro, School)
- Monthly price
- Feature list (bullet points)
- A "Select" or "Current Plan" button
- Uses the existing `Button` and `Card` shadcn components

Tier data is in `src/lib/school/pricing.ts` — import `TIERS` from it.

### Step 3: Create the onboarding wizard

Create `src/components/school/school-onboarding-wizard.tsx`:

A 4-step wizard (model after `src/components/onboarding/onboarding-wizard.tsx`):

1. **School Details**: name, address, province, contact email
2. **Tier Selection**: show `TierCard` for each available tier
3. **Payment**: redirects to Stripe Checkout (return to `/school?success=1`)
4. **Confirmation**: shows school details + "Go to Dashboard" button

### Step 4: Create the page and client component

Create `src/app/[locale]/school/school-client.tsx`:

- Uses `useSchool()` to load current school/billing status
- If no school: show the onboarding wizard
- If school exists: show school info + current plan + "Manage Billing" button

Create `src/app/[locale]/school/page.tsx`:

- Wraps `<SchoolClient>` in `PageContainer`
- Loading state with `<PageSkeleton>`

### Step 5: Verify

```bash
pnpm exec oxlint --fix
pnpm run typecheck
pnpm run test
```

All pass with 0 errors.

## Test plan

- `src/hooks/__tests__/use-school.test.tsx` — test `useSchool()` and
  `useRegisterSchool()` with mocked API
  - Pattern: `vi.mocked(apiFetch).mockResolvedValue(...)` (see
    `src/hooks/__tests__/use-question-engine.test.tsx`)
  - 3 tests: loads school data, handles 404 (no school), handles error
- `src/components/school/__tests__/tier-card.test.tsx` — render test with
  mock tier data (see `src/components/quiz/__tests__/quiz-result.test.tsx`)
  - 2 tests: renders tier name, renders features list

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] `pnpm run test` exits 0; new tests for use-school and tier-card exist and pass
- [ ] Navigating to `/school` shows the onboarding wizard (or school info)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The school API routes return different shapes than expected — check by
  calling them or reading `src/app/api/school/` route files
- Stripe Checkout session creation requires a return URL parameter; if the
  frontend URL isn't known at build time, use `window.location.origin`
- The design spec contradicts existing implementation — prefer the API
  reality over the design spec

## Maintenance notes

- When Stripe webhooks are implemented for subscription lifecycle events,
  the "Manage Billing" flow should redirect to Stripe Customer Portal instead
- School plan changes (upgrade/downgrade) are handled by Stripe Billing;
  the UI should reflect the subscription status returned by the billing API
- Add the school page to the navigation sidebar config
  (`src/lib/navigation/config.ts`) once the page is ready
