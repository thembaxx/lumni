# Plan 192: Create school/licensing onboarding pages

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 690ee57f..HEAD -- src/app/[locale]/school/ src/components/school/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `690ee57f`, 2026-07-17
- **Issue**: (none)

## Why this matters

The school licensing system has 8 API routes (register, checkout, cancel, billing, link-teacher, link-student, check-domain, members), a full service layer with Stripe billing integration, 3-tier pricing, feature gating, and 3 React components (onboarding wizard, tier card, seat manager). But there is no page that mounts these components — a teacher navigating to `/school/onboarding` gets a 404. The entire licensing infrastructure is invisible to the only people who can use it. This is the highest-leverage unshipped feature: it's the go-to-market path for the B2B2C model.

## Current state

**Existing infrastructure** (all already built):

- `src/lib/school/service.ts` — `getSchool()`, `createSchool()`, `getSchoolMembers()`, `linkTeacher()`, `linkStudent()` — 343 lines, full CRUD against Appwrite `schools` and `school_members` collections
- `src/lib/school/billing-service.ts` — `getBillingInfo()`, `createCheckoutSession()`, `handleStripeWebhook()`, `cancelSubscription()` — 192 lines, Stripe integration
- `src/lib/school/pricing.ts` — `PRICING` object with 3 tiers (Free/Standard/Premium), `calculatePrice()`, `generateSchoolCode()`, `generateSlug()`
- `src/lib/school/tier-enforcer.ts` — `meetsTierRequirement()`, `hasFeatureAccess()` — feature gating by tier
- `src/components/school/onboarding-wizard.tsx` — 342 lines, 4-step wizard component (Step 1: School Info, Step 2: Plan Selection, Step 3: Payment, Step 4: Seats)
- `src/components/school/tier-card.tsx` — 62 lines, plan selector card
- `src/components/school/seat-manager.tsx` — 96 lines, join code display + copy
- API routes: `POST /api/school/register`, `POST /api/school/checkout`, `POST /api/school/cancel`, `GET /api/school/billing`, `POST /api/school/link-teacher`, `POST /api/school/link-student`, `GET /api/school/members`, `GET /api/school/check-domain`, `GET /api/admin/schools`, `GET /api/admin/schools/[schoolId]`, `POST /api/stripe/webhook`

**Missing**:

- No `src/app/[locale]/school/` directory at all — no pages mount the existing components
- No Stripe SDK package installed (`stripe` npm package)
- No Payfast ITN handler (for SA payment method)
- No free tier caps wired (20 questions/day, 5 solves/day for free tier)
- No trial management (14-day trial, reminder emails, auto-suspend)

**Repo conventions**:

- Pages use `<PageContainer>` wrapper. See `src/app/[locale]/practice/page.tsx` as exemplar.
- Client components use `"use client"` directive and are named `*-client.tsx`
- Forms use `@/components/ui/input`, `@/components/ui/button`, `@/components/ui/card`
- API calls use `apiFetch` from `@/lib/shared/api-fetch`
- Loaders use `<PageSkeleton>` (see `src/components/ui/page-skeleton.tsx`)
- Toast notifications use `toast()` from `@/components/ui/toast`

## Commands you will need

| Purpose   | Command                 | Expected on success |
| --------- | ----------------------- | ------------------- |
| Install   | `pnpm add stripe`       | exit 0              |
| Typecheck | `pnpm typecheck`        | exit 0, no errors   |
| Tests     | `pnpm test`             | all pass            |
| Lint      | `pnpm exec biome check` | exit 0              |
| Build     | `pnpm run build`        | exit 0              |

## Scope

**In scope**:

- `src/app/[locale]/school/onboarding/page.tsx` — mount `SchoolOnboardingWizard`
- `src/app/[locale]/school/onboarding/loading.tsx` — loader component
- `src/app/[locale]/school/admin/page.tsx` — school admin dashboard
- `src/app/[locale]/school/admin/loading.tsx` — loader
- `src/app/[locale]/school/billing/page.tsx` — billing history and plan management
- `src/app/[locale]/school/billing/loading.tsx` — loader
- `src/app/[locale]/school/page.tsx` — school hub/landing page (redirects to onboarding if no school, or admin if has school)
- `package.json` — add `stripe` dependency
- `src/app/api/payfast/itn/route.ts` — Payfast Instant Transaction Notification handler (new)
- `src/lib/exam-paper-ingestion/` — wire free tier cap check into question generation

**Out of scope**:

- Modifying existing school API routes or service files
- Modifying `onboarding-wizard.tsx`, `tier-card.tsx`, or `seat-manager.tsx` (they work as-is)
- Building the full school admin dashboard UI (use existing components; build a thin page wrapper)
- Trial reminder email cron (deferred)
- Domain auto-discovery (deferred — the `check-domain` endpoint exists but the onboarding wizard should let the teacher type their domain)

## Git workflow

- Branch: `advisor/192-school-onboarding-pages`
- Commit style: conventional commits
- Do NOT push or open PR unless instructed

## Steps

### Step 1: Install Stripe SDK

```bash
pnpm add stripe
```

Verify: `pnpm typecheck` exits 0 (the existing `billing-service.ts` likely already imports from `stripe` — if it was stubbed, the import may now resolve).

### Step 2: Create the school onboarding page

Create `src/app/[locale]/school/onboarding/page.tsx`:

```tsx
import { PageContainer } from "@/components/layout/page-container";
import { SchoolOnboardingWizard } from "@/components/school/onboarding-wizard";

export default function SchoolOnboardingPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl py-8">
        <SchoolOnboardingWizard />
      </div>
    </PageContainer>
  );
}
```

Create `src/app/[locale]/school/onboarding/loading.tsx`:

```tsx
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function OnboardingLoading() {
  return <PageSkeleton />;
}
```

**Verify**: `pnpm typecheck` exits 0.

### Step 3: Create the school admin page

Create `src/app/[locale]/school/admin/page.tsx`:

A client component that:

1. Calls `GET /api/school/members` to load school data
2. Shows a school info card (name, domain, tier, seats used/total)
3. Shows the `SeatManager` component with the join code
4. Links to billing page
5. Links to cancel/manage subscription

```tsx
import { SchoolAdminClient } from "./school-admin-client";
import { PageContainer } from "@/components/layout/page-container";

export default function SchoolAdminPage() {
  return (
    <PageContainer>
      <SchoolAdminClient />
    </PageContainer>
  );
}
```

Create `src/app/[locale]/school/admin/school-admin-client.tsx` as a `"use client"` component. Use `useQuery` from TanStack Query to fetch school data, render `SeatManager`, and show member list. Follow the pattern of existing admin/report pages.

**Verify**: `pnpm typecheck` exits 0.

### Step 4: Create the billing page

Create `src/app/[locale]/school/billing/page.tsx`:

A client component that:

1. Calls `GET /api/school/billing` to load current license + invoices
2. Shows current plan tier, price, billing frequency
3. Shows invoice history table
4. Has "Change Plan" and "Cancel Subscription" buttons
5. Provides a way to update payment method

Follow the patterns in `src/components/school/onboarding-wizard.tsx` for tier selection UI.

**Verify**: `pnpm typecheck` exits 0.

### Step 5: Create the school hub page

Create `src/app/[locale]/school/page.tsx`:

A client component that checks if the user has a school association:

1. If no school: redirect to `/school/onboarding` or show a hero CTA ("Start your school setup")
2. If has school: redirect to `/school/admin`
3. Handle loading state while checking

This can be a thin wrapper using the existing `GET /api/school/members` endpoint to determine state.

### Step 6: Add Payfast ITN handler

Create `src/app/api/payfast/itn/route.ts`:

A Payfast Instant Transaction Notification handler that:

1. Validates the incoming POST data signature against the Payfast sandbox/live passphrase
2. Confirms the payment was successful (`payment_status === "COMPLETE"`)
3. Looks up the pending license by `m_payment_id`
4. Activates the license and creates an invoice record
5. Returns `200 OK` to acknowledge

Follow the Stripe webhook pattern in `billing-service.ts`. Use `createRouteHandler` with `auth: "none"` (Payfast sends server-to-server).

```ts
// Outline
import { createRouteHandler } from "@/lib/api/create-route-handler";

export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "PayfastItn",
  execute: async ({ req }) => {
    const formData = await req.formData(); // Payfast sends form-encoded POST
    const data = Object.fromEntries(formData);
    // 1. Validate signature
    // 2. Check payment_status === "COMPLETE"
    // 3. Update license status
    // 4. Create invoice record
    // 5. Return 200
    return { ok: true };
  },
});
```

The Payfast passphrase should come from `process.env.PAYFAST_PASSPHRASE` (optional — route degrades gracefully if unset).

### Step 7: Wire free tier caps

In the question engine's generate path, add a check: if the user's school has a free tier, enforce the daily limit from `PRICING.free.aiQuestionsPerDay` (20). This uses the existing `tier-enforcer.ts`:

```ts
// In the relevant route handler or service:
const tier = await getUserLicenseTier(userId);
const allowed = PRICING[tier].aiQuestionsPerDay;
const used = await getTodayQuestionCount(userId);
if (used >= allowed) {
  return { error: "Daily question limit reached for your school tier" };
}
```

This is a minimal gate — it does not need to be comprehensive. The `tier-enforcer.ts` already has `hasFeatureAccess()`. Wire it into the `/api/engine/generate` route.

### Step 8: Run full verification

```bash
pnpm typecheck && pnpm exec biome check && pnpm test
```

All should pass. Then build:

```bash
pnpm run build
```

## Test plan

- New tests:
  - `src/app/[locale]/school/__tests__/onboarding-page.test.tsx` — renders the wizard, doesn't crash
  - `src/app/[locale]/school/__tests__/admin-page.test.tsx` — mocks school data, renders seat manager
  - `src/app/api/payfast/__tests__/itn-handler.test.ts` — happy path + invalid signature
- Follow the pattern in `src/app/api/teacher/__tests__/classroom-code.test.ts`
- No new tests needed for existing components (they already work)

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0 (including new tests)
- [ ] `pnpm run build` exits 0
- [ ] Navigating to `/school/onboarding` shows the 4-step onboarding wizard
- [ ] Navigating to `/school/admin` shows school info and seat manager
- [ ] Navigating to `/school/billing` shows billing history (or graceful empty state)
- [ ] Stripe SDK is installed and importable
- [ ] Payfast ITN route exists and returns 200 on valid POST
- [ ] Free tier question cap is checked before generating questions
- [ ] Only files in scope are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `SchoolOnboardingWizard` component has hardcoded assumptions about state management that prevent it from being mounted on a page (e.g. it expects specific parent context or props that aren't obvious from its interface)
- The school API routes require a different auth mode than expected (check each route's `auth` field in `createRouteHandler`)
- Stripe SDK install reveals breaking API changes in the existing `billing-service.ts`
- Any of the existing school components have styling that assumes they're inside a dialog/modal rather than a full page

## Maintenance notes

- The Payfast integration is minimal (ITN handler only). A full Payfast checkout flow (redirect, return URL handling) is deferred.
- Trial management (14-day trial, 3 reminder emails, auto-suspend) is deferred. The `trialEndsAt` field is already in the data model — wire it when needed.
- The free tier cap is a hard stop, not a soft warning. Consider a soft warning + upgrade nudge as a follow-up.
- If Stripe's API changes (v2), the `billing-service.ts` webhook handling may need updates.
