# Plan 003: School licensing onboarding wizard

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c91fa0d4..HEAD -- src/app/api/school/ src/lib/school/ src/app/[locale]/school/ src/components/school/ src/app/api/stripe/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `c91fa0d4`, 2026-07-10
- **Issue**: (none)

## Why this matters

The school licensing backend is fully built: school registration (`POST /api/school/register`), checkout (`POST /api/school/checkout`), pricing config (`src/lib/school/pricing.ts`), billing service with Stripe integration, license activation via Stripe webhook, and 5 Appwrite collections (schools, members, codes, licenses, invoices). But there is zero frontend — no onboarding wizard, no school admin dashboard, no tier enforcement. Schools cannot sign up. This is the single largest stated-but-undelivered item in the codebase.

## Current state

- `src/lib/school/pricing.ts` — defines Free/Standard/Premium tiers with per-school pricing, seat limits, feature sets
- `src/lib/school/billing-service.ts` — creates Stripe checkout sessions, maps school tiers to Stripe price IDs
- `src/lib/school/service.ts` — `createSchool()`, `addSchoolMember()`, `getSchoolByJoinCode()`, etc.
- `src/app/api/school/register/route.ts` — Zod-validated POST handler that calls `createSchool()`. Returns `{ schoolId, name, tier, seatCount, joinCode }`.
- `src/app/api/school/checkout/route.ts` — creates Stripe checkout session, returns URL
- `src/app/api/stripe/webhook/route.ts` — handles `checkout.session.completed` → activates license
- `docs/superpowers/2026-07-05-licensing-onboarding-flow.md` — design spike describing a 4-step wizard
- `docs/superpowers/2026-07-05-licensing-tier-mapping.md` — feature-to-tier mapping (no enforcement implemented)
- No `/school/onboarding` route exists
- No tier enforcement middleware exists
- No school admin dashboard exists

The repo uses `"use client"` + React hooks + `next-intl` (`useTranslations()`) for UI, and `createRouteHandler` with optional `auth` for API routes. Components live in `src/components/`. Pages use `<PageContainer>` and follow App Router conventions.

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Install   | `pnpm install`            | exit 0              |
| Typecheck | `pnpm run typecheck`      | exit 0              |
| Tests     | `pnpm run test -- --run`  | all pass            |
| Lint      | `pnpm exec oxlint --fix`  | exit 0              |
| Format    | `pnpm exec oxfmt --check` | clean               |

## Scope

**In scope**:

- `src/app/[locale]/school/onboarding/` — new 4-step wizard page route
- `src/components/school/onboarding-wizard.tsx` — wizard component (school info → subscription → payment → seats)
- `src/components/school/tier-card.tsx` — pricing tier selection card
- `src/components/school/seat-manager.tsx` — invite teachers / allocate seats
- `src/lib/school/tier-enforcer.ts` — middleware for feature gating by license tier
- `src/middleware.ts` — add school tier check for relevant routes

**Out of scope**:

- Do NOT build a full school admin dashboard — just the onboarding flow + seat management
- Do NOT rewrite the Stripe integration — reuse existing `billing-service.ts`
- Do NOT implement every tier limit from the design doc — implement the gating hook only
- Do NOT modify existing school API routes

## Git workflow

- Branch: `advisor/003-school-onboarding`
- Commit per step: wizard → tier selection → payment → seats → middleware
- Message style: conventional commits — `feat(school): add onboarding wizard`

## Steps

### Step 1: Create onboarding wizard component

Create `src/components/school/onboarding-wizard.tsx` — a `"use client"` component with 4 steps:

1. **School info**: name, domain, contact email, phone, address. Matches the Zod schema in `POST /api/school/register`.
2. **Subscription**: show 3 tier cards (Free/Standard/Premium) using the pricing from `src/lib/school/pricing.ts`. Each card shows price/seat count/features. Selected tier is highlighted.
3. **Payment**: if tier is paid (Standard/Premium), call `POST /api/school/checkout` and redirect to Stripe. If Free, skip payment.
4. **Seats**: after registration (or webhook confirmation), show seat allocation UI — invite teachers by email, generate join codes.

Use `AnimatePresence` for step transitions (follow the pattern in `src/components/onboarding/subject-card.tsx` for animation + state management). Store wizard state with `useState` (not persisted — loss-tolerant).

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Create the page route

Create `src/app/[locale]/school/onboarding/page.tsx`:

```tsx
import { SchoolOnboardingWizard } from "@/components/school/onboarding-wizard";

export default function SchoolOnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <SchoolOnboardingWizard />
    </div>
  );
}
```

Wrap with `<PageContainer>` if the existing page layout convention requires it (check a sibling page like `src/app/[locale]/onboarding/page.tsx`).

**Verify**: Navigate to `/school/onboarding` — wizard renders.

### Step 3: Create seat manager component

Create `src/components/school/seat-manager.tsx`:

- Shows current seats used vs total (e.g. "3 of 10 seats allocated")
- "Invite teacher" form: email input + role selector (admin/teacher) → calls `POST /api/school/members`
- Shows existing members with their roles
- "Generate join code" button → calls `POST /api/school/join-codes`
- Follows the card+button pattern in `src/components/settings/tabs/sections/subject-picker.tsx`

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Build tier enforcement middleware

Create `src/lib/school/tier-enforcer.ts`:

```typescript
import type { DataAccess } from "@/lib/db/data-access";

export interface TierGate {
  feature: string;
  minTier: "free" | "standard" | "premium";
}

// Check if a school's current license tier has access to a feature
export async function hasFeatureAccess(
  db: Pick<DataAccess, "userSettings">,
  userId: string,
  feature: string,
): Promise<boolean> {
  // Read user's school membership
  // Look up school's current license tier
  // Compare against TIRE_GATES[feature].minTier
  return true; // default: allow
}
```

The `TIER_GATES` registry maps feature names to minimum tier requirements:

```typescript
export const TIER_GATES: Record<string, string> = {
  "ai-questions": "free",
  "teacher-seats": "standard",
  "analytics-deep": "premium",
  "api-access": "premium",
};
```

This is a lightweight check — not a middleware interceptor yet (that's Step 5). Export the gate registry and the check function.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 5: Wire tier enforcement in middleware

In `src/middleware.ts`, add a route group for paths that need school-tier checks (e.g. `/teacher/*`, `/admin/*`). Read the user's school license from the session and redirect to an upgrade page if their tier is insufficient.

If the middleware architecture uses `createRouteHandler` (check existing `src/app/api/teacher/*` routes), add the tier check in the route handler's `validate` or `execute` step instead. Follow the existing pattern — look at how `auth: "required"` is used in routes like `src/app/api/teacher/roster/import/route.ts`.

**Verify**: `pnpm run typecheck` → exit 0.

## Test plan

- Create `src/lib/school/__tests__/tier-enforcer.test.ts` — test tier gate definitions and `hasFeatureAccess()` logic with an `InMemoryDataAccess` mock. Follow the test pattern from `src/lib/school/__tests__/`.
- Create `src/components/school/__tests__/onboarding-wizard.test.tsx` — render test confirming all 4 steps are present. Follow patterns from `src/components/quiz/__tests__/quiz-result.test.tsx`.

**Verify**: `pnpm run test -- --run` → all tests pass.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run` exits 0; new tests exist
- [ ] `/school/onboarding` page renders a 4-step wizard
- [ ] Free tier signup completes end-to-end (no payment)
- [ ] Paid tier redirects to Stripe checkout
- [ ] Seat manager shows current allocation and invite form
- [ ] `TIER_GATES` registry exists at `src/lib/school/tier-enforcer.ts`
- [ ] Tier check wired in at least one route handler
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- `src/app/api/school/checkout/route.ts` doesn't exist or doesn't work (verify by reading it)
- The Stripe webhook handler doesn't properly activate licenses (check `src/app/api/stripe/webhook/route.ts`)
- POST `/api/school/register` returns a different shape than described above (read it before starting step 1)

## Maintenance notes

- When new paid features are added, they must be added to `TIER_GATES` with the correct minimum tier.
- The design doc at `docs/superpowers/2026-07-05-licensing-onboarding-flow.md` has the full wizard spec — refer to it for copy and step order.
- Stripe price IDs should be configured via env vars, not hardcoded — check `src/lib/school/billing-service.ts` for the pattern.
