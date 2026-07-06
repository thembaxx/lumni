# Plan 108: School service — characterization tests + billing split

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7bb0d688..HEAD -- src/lib/school/`
> If any file in the school module changed since this plan was written,
> re-read the live code and adjust steps accordingly before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M (characterization tests: S; billing split: S; UI: S)
- **Risk**: MEDIUM (billing split touches Stripe; route handlers must keep working)
- **Depends on**: none
- **Category**: architecture / test coverage
- **Planned at**: commit `7bb0d688`, 2026-07-06
- **Issue**: (omit unless published via `--issues`)

## Why this matters

The school module at `src/lib/school/service.ts` is a 528-line god module
that mixes two very different concerns:

1. **School CRUD** (lines 62–344): creating schools, managing members,
   looking up codes, checking domains — pure Appwrite data operations.
2. **Billing** (lines 346–527): Stripe checkout session creation, invoice
   queries, subscription cancellation — payment processing with external
   API calls, completely different failure modes and test requirements.

There are zero tests for any of it. This means:

- Every Stripe API change requires manual testing
- The `createStripeCheckoutSession` function lazy-imports Stripe, creates
  ephemeral prices, and writes to Appwrite in one monolithic function
- If Stripe is down, the entire school creation flow blocks
- No separation between business logic and payment orchestration

Characterization tests capture the current behaviour (warts and all) before
refactoring, so you know you haven't broken anything.

## Current state

The `src/lib/school/` directory has two files:

- `service.ts` — 528 lines, 13 exported async functions
- `pricing.ts` — `calculatePrice()`, `generateSchoolCode()`, `generateSlug()`,
  `LicenseTier` type

The 8 route handlers in `src/app/api/school/*/route.ts` all call the
service functions directly.

## Commands you will need

| Purpose   | Command                            | Expected on success |
| --------- | ---------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`               | exit 0, no errors   |
| Tests     | `pnpm run test -- --grep "school"` | all pass            |
| Full test | `pnpm run test`                    | all pass            |
| Lint      | `pnpm exec oxlint`                 | exit 0              |
| Format    | `pnpm exec oxfmt --check`          | exit 0              |

## Scope

**In scope**:

- `src/lib/school/service.ts` — add type exports for DI seam
- `src/lib/school/billing-service.ts` — new file: Stripe billing extracted
- `src/lib/school/__tests__/service.test.ts` — characterization tests
- `src/app/api/school/checkout/route.ts` — use billing service
- `src/app/api/school/cancel/route.ts` — use billing service
- `src/app/api/school/billing/route.ts` — use billing service
- `src/lib/school/index.ts` — update barrel exports

**Out of scope**:

- Adding a school management UI page
- Adding authentication guards to school routes (separate concern)
- Changing Stripe API version or billing flow semantics
- Adding E2E tests for the checkout flow
- Existing `src/app/api/school/register/route.ts` and member routes (CRUD only, no billing change)

## Git workflow

- Branch: `advisor/108-school-service-tests-split`
- Commits: one per phase (tests, billing split, barrel update)
- Do NOT push or open a PR unless instructed

## Steps

### Phase 1: Characterization tests (S-effort)

Create `src/lib/school/__tests__/service.test.ts`. These tests capture the
current behaviour by mocking Appwrite at the `databases` level. They do NOT
test Stripe calls — Stripe is `createStripeCheckoutSession`'s concern, and
will be tested in Phase 2.

Test the following functions from `service.ts`:

- `mapSchool()` / `SchoolResult` shape (pure function, test a sample doc)
- `createSchool()` — mock `databases.listDocuments` (domain check) and
  `databases.createDocument` (x3: school, admin member, teacher member,
  school code). Verify the returned shape includes `joinCode`.
- `getSchool()` — mock `databases.getDocument`, verify null on error
- `listSchools()` — mock `databases.listDocuments`, verify pagination
- `getSchoolMembers()` — mock `databases.listDocuments`, verify grouped
  return (admins, teachers, students)
- `addSchoolMember()` — mock `databases.createDocument` + `getDocument` +
  `updateDocument` (seat increment). Verify teacher increments seats.
- `isUserSchoolMember()` — mock `databases.listDocuments`, verify both
  member/non-member paths.
- `lookupSchoolByCode()` — mock `databases.listDocuments`, verify expiry
  and maxUses checks.
- `checkDomain()` — mock `databases.listDocuments`, verify both paths.

**Pattern**: use `vi.mock()` for `@/lib/appwrite.server` to replace
`databases` with a `vi.fn()`-backed mock. Since Appwrite SDK types are
complex, cast the mock return to `any` for the test — these are
characterization tests, not type-safety exercises.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/appwrite.server", () => ({
  databases: {
    listDocuments: vi.fn(),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
  },
}));

import { databases } from "@/lib/appwrite.server";
import {
  createSchool,
  getSchool,
  listSchools,
  // ...
} from "@/lib/school/service";
```

**Verify**:

```bash
pnpm run test -- --grep "school|SchoolService"
# → all pass (expected: ~8 test cases)
pnpm run typecheck
# → exit 0
```

### Phase 2: Extract billing service (S-effort)

Create `src/lib/school/billing-service.ts` with:

```ts
export async function getBillingInfo(schoolId: string, page?: number, limit?: number): Promise<...>
export async function createStripeCheckoutSession(schoolId: string, tier: LicenseTier, billingFrequency: "monthly" | "annual", seatCount: number, returnUrl: string): Promise<...>
export async function cancelSubscription(schoolId: string, immediate: boolean): Promise<...>
```

These are exact copies of the corresponding functions from `service.ts`.
Leave the originals in place but have them delegate:

```ts
// In service.ts
export async function getBillingInfo(schoolId, page, limit) {
  return getBillingInfo(schoolId, page, limit); // delegate to billing
}
```

Wait — naming collision. Better approach:

1. Copy the 3 billing functions verbatim into `billing-service.ts`.
2. In `service.ts`, replace the function bodies with delegating wrappers:

```ts
import {
  getBillingInfo as getBillingInfoImpl,
  createStripeCheckoutSession as createCheckoutImpl,
  cancelSubscription as cancelSubImpl,
} from "./billing-service";

export async function getBillingInfo(...args) {
  return getBillingInfoImpl(...args);
}
// etc.
```

This preserves all existing imports across the codebase while establishing
the seam. Alternatively, just export both from the barrel and update the 3
route handlers directly — that's cleaner because there's no delegation layer
to maintain.

**Preferred approach**: Export from `billing-service.ts` and update the 3
route handlers to import from the new file directly.

1. Create `billing-service.ts` with the 3 functions copied verbatim
2. In `service.ts`, delete the 3 billing functions (lines 346–527)
3. Update imports in:
   - `src/app/api/school/checkout/route.ts` — change import from
     `"@/lib/school/service"` to `"@/lib/school/billing-service"`
   - `src/app/api/school/cancel/route.ts` — same
   - `src/app/api/school/billing/route.ts` — same

**Verify**:

```bash
pnpm run typecheck
# → exit 0
pnpm run test
# → all pass (the characterization tests from Phase 1 still pass;
#   billing functions may need their own test file)
rg "from.*@/lib/school/service" src/app/api/school/
# → only register, members, link-teacher, link-student, check-domain routes left
```

### Phase 3: Update barrel exports (S-effort)

Update `src/lib/school/index.ts` to re-export everything from both
`service.ts` and `billing-service.ts`.

```ts
export * from "./service";
export * from "./billing-service";
export * from "./pricing";
```

**Verify**:

```bash
pnpm run typecheck
# → exit 0
```

### Phase 4: Full verification

**Verify**:

```bash
pnpm run typecheck
# → exit 0
pnpm run test
# → all pass (existing 1843+ plus ~8 new school tests)
pnpm exec oxfmt --check
# → exit 0
pnpm exec oxlint
# → exit 0
```

## Test plan

### Phase 1 tests (characterization)

| Test case                       | Input                          | Expected output                         |
| ------------------------------- | ------------------------------ | --------------------------------------- |
| `createSchool` success          | valid input + domain not taken | returns school + joinCode, 4 creates    |
| `createSchool` domain taken     | existing domain                | throws with code: DOMAIN_TAKEN          |
| `getSchool` found               | valid schoolId                 | returns SchoolResult                    |
| `getSchool` not found           | invalid schoolId               | returns null                            |
| `listSchools` default           | no params                      | returns schools array + total           |
| `getSchoolMembers` grouped      | schoolId with 3 roles          | returns admins/teachers/students arrays |
| `addSchoolMember` teacher       | teacher role                   | increments seatsUsed                    |
| `isUserSchoolMember` member     | valid school + user            | returns { isMember: true, role }        |
| `isUserSchoolMember` non-member | no match                       | returns { isMember: false }             |
| `lookupSchoolByCode` valid      | active code                    | returns school + type                   |
| `lookupSchoolByCode` expired    | expired code                   | returns null/null                       |
| `checkDomain` registered        | existing domain                | returns registered: true + schoolId     |
| `checkDomain` free              | new domain                     | returns registered: false               |

### Phase 2 — no new tests (billing functions are coupled to Stripe SDK; unit-testing

them requires either full mocking of the `stripe` module, which is
out of scope for this plan. The characterization tests already cover
service-level functions that call the billing wrappers.)

## Done criteria

ALL must hold:

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0 (including ~8 new school characterization tests)
- [ ] `pnpm exec oxfmt --check` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `src/lib/school/billing-service.ts` exists with `getBillingInfo`,
      `createStripeCheckoutSession`, and `cancelSubscription`
- [ ] `src/lib/school/service.ts` no longer contains billing functions
- [ ] `src/app/api/school/checkout/route.ts`, `cancel/route.ts`,
      `billing/route.ts` import from `@/lib/school/billing-service`
- [ ] `src/lib/school/index.ts` re-exports both service files
- [ ] All existing route handlers still work (no import breakage)
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report back (do not improvise) if:

- Any route handler other than `checkout/route.ts`, `cancel/route.ts`, or
  `billing/route.ts` imports the billing functions (do a grep first:
  `rg "getBillingInfo|createStripeCheckoutSession|cancelSubscription" src/`)
- The `vi.mock()` approach causes module resolution issues with Appwrite SDK
  (Appwrite v1 SDK has complex internal imports that may need `vi.mock` with
  `{ spy: true }` or a factory function)
- Stripe lazy-import pattern (`await import("stripe")`) in the billing
  functions makes it impossible to test without mocking the entire Node
  runtime — if so, just keep the billing functions in place and focus on
  CRUD tests + barrel separation only

## Maintenance notes

- `createStripeCheckoutSession` uses `new Stripe(..., { apiVersion: "2026-05-27.dahlia" })`.
  Stripe API versions are pinned strings — update when upgrading Stripe SDK.
- The billing service is still coupled to Appwrite (queries `LICENSES` and
  `INVOICES` collections). A future improvement would inject an
  `AppwriteDatabase` interface to make billing fully unit-testable.
- The 3 billing route handlers are thin wrappers — they validate the
  request body and call the billing service. No logic change needed in
  this plan.
