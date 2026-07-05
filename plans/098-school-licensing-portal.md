# Plan 098: Design spike — school/district licensing portal

> **Executor instructions**: This is a design spike, not a build. Investigate, prototype API shapes, define the data model, and produce a spec. Do NOT implement production-grade billing, seat management, or payment processing — explore what's needed and document the architecture.
>
> Run every verification command. If anything in "STOP conditions" occurs, stop and report.
>
> **Drift check (run first)**: `git diff --stat a8d53ec7..HEAD -- src/app/api/ src/lib/server/ src/lib/services/ .env.example`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1 (existential — without revenue the project is a cost center)
- **Effort**: L (design spike: 1-2 weeks)
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `a8d53ec7`, 2026-07-05

## Why this matters

Premium gating was removed entirely in Session 36 (`26635245`). The app has ongoing costs: AI API calls ($0.008–0.015 per generate per `latency-tracker.ts`), Ably real-time connections, UploadThing file storage, Appwrite Cloud compute, Vercel hosting. The Stripe SDK (`stripe@22.2.0`) and Payfast vars remain in `.env.example` but are unused — the only monetization infrastructure is a session-36-era dead code path.

The most viable path is B2B2C: sell school/district licenses. SA has ~25,000 high schools. Even 0.5% penetration at R50/school/month is meaningful revenue. Teacher tools and student reporting already exist — there is a licensing product without a licensing pipeline.

## Current state

- **Stripe/Payfast remnants**: `.env.example:42-54` has `STRIPE_SECRET_KEY`, `PAYFAST_MERCHANT_ID`, etc. `docs/superpowers/specs/2026-05-27-monetization-end-to-end.md` describes a completed Stripe webhook + Payfast checkout flow. But premium is removed — these paths are dead.
- **Teacher tools**: `src/lib/server/teacher-service.ts` (273 lines) — real Appwrite-backed service with `getStudents()`, `getTopicMastery()`, `getEngagementStats()`, `assignToStudent()`, `linkStudentToTeacher()`. 7 API routes under `src/app/api/teacher/`.
- **Parent tools**: `src/app/[locale]/parent/` — dashboard with child selector, activity timeline, weekly report panel.
- **No billing infrastructure**: Zero seat management, no invoicing, no school onboarding, no usage reporting per school.
- **No school-specific collections in Appwrite**: No `schools`, `licenses`, `invoices` table schemas.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Install   | `pnpm install`       | exit 0              |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope** (investigate and produce designs for):

- Data model for schools, licenses, seats, invoices
- API surface for school onboarding (self-serve + sales-assisted)
- Billing integration architecture (Stripe subscriptions vs Payfast once-off vs both)
- Seat management UX (admin adds/removes teachers; teachers onboard students)
- Pricing model exploration (per-school flat, per-student, per-teacher, tiered)
- School onboarding wizard UI sketch

**Out of scope** (do NOT implement):

- Actual payment processing
- Production Appwrite collections for billing
- Stripe webhook changes
- UI components beyond wireframes/sketches
- Migration of existing teacher/parent tools into the licensing model

## Steps

### Step 1: Investigate existing monetization artifacts

Read these files to understand what was previously built and can be repurposed:

- `docs/superpowers/specs/2026-05-27-monetization-end-to-end.md` — the full Stripe+Payfast integration spec
- `src/app/api/stripe/webhook/route.ts` — existing webhook handler
- `src/app/api/payfast/` directory — existing Payfast routes
- `.env.example` lines 42-60 — billing-related env vars
- `src/lib/db/client.ts` — check for any `premium_subscriptions` or `billing` collection constants
- `src/lib/navigation/config.ts` — check for `/premium` route references

**Verify**: Document what exists and what's dead. Write a summary to `docs/superpowers/2026-07-05-licensing-existing-infra.md`.

### Step 2: Design the data model

Propose Appwrite collections (or Dexie tables for the offline path) for:

- **`schools`**: id, name, domain (for SSO discovery), address, contactEmail, licenseTier, seatsPurchased, seatsUsed, billingStatus, trialEndsAt
- **`school_admins`**: schoolId, userId, role (admin/billing/teacher-manager)
- **`licenses`**: id, schoolId, stripeSubscriptionId, tier, status, startDate, endDate, autoRenew
- **`invoices`**: id, schoolId, amount, currency, status, paidAt, periodStart, periodEnd

Consider: should teachers belong to a school, or can a school have multiple teacher accounts? How does student discovery work (school code, email domain, imported roster)?

**Verify**: Write the schema design to `docs/superpowers/2026-07-05-licensing-data-model.md`.

### Step 3: Design the API surface

Spec the endpoints needed:

| Endpoint                        | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `POST /api/school/register`     | Self-serve school onboarding                           |
| `POST /api/school/checkout`     | Create Stripe/Payfast checkout session for chosen tier |
| `GET /api/school/billing`       | Billing history, invoice download                      |
| `POST /api/school/seat/add`     | Add seats (triggers prorated Stripe invoice)           |
| `POST /api/school/link-teacher` | Teacher joins school (by code or email domain)         |
| `GET /api/admin/schools`        | Admin list of all schools with license status          |
| `GET /api/admin/schools/[id]`   | School detail: seats, active teachers, usage stats     |

For each endpoint, specify: auth requirements, rate limiting, expected Zod schema, response shape.

**Verify**: Write the API spec to `docs/superpowers/2026-07-05-licensing-api.md`.

### Step 4: Design the onboarding flow

Sketch the 4-step school onboarding wizard:

1. **School info**: Name, address, domain, contact — with email domain auto-discovery (if `@southpenhigh.co.za`, pre-select school)
2. **Plan selection**: Tier comparison table (Free / Standard / Premium) — what each includes (seat count, AI questions/day, analytics depth)
3. **Payment**: Stripe Checkout or Payfast redirect — capture billing contact separately from school admin
4. **Seat allocation**: Add initial teachers by email — sends invite links

Consider the "trial" flow: 14-day free trial with full features, auto-convert to paid.

**Verify**: Create a markdown flow document at `docs/superpowers/2026-07-05-licensing-onboarding-flow.md`.

### Step 5: Repurposing analysis

Map existing teacher/parent features to the licensing model:

- Current teacher dashboard → becomes school-licensed feature
- Parent access → becomes school-licensed or add-on
- Ghost links (30-day aggregate stats) → marketing funnel for school sales
- Existing `teacher-service.ts` → extend with school-aware queries

Identify: what stays free for individual users? What gates behind a school license?

**Verify**: Write the tier mapping to `docs/superpowers/2026-07-05-licensing-tier-mapping.md`.

## Deliverables

All output goes to `docs/superpowers/`:

- [ ] `docs/superpowers/2026-07-05-licensing-existing-infra.md` — audit of existing monetization artifacts
- [ ] `docs/superpowers/2026-07-05-licensing-data-model.md` — proposed schema
- [ ] `docs/superpowers/2026-07-05-licensing-api.md` — API spec
- [ ] `docs/superpowers/2026-07-05-licensing-onboarding-flow.md` — wizard UX flow
- [ ] `docs/superpowers/2026-07-05-licensing-tier-mapping.md` — what gates behind license

## Done criteria

ALL must hold:

- [ ] All 5 deliverable documents exist and are internally consistent
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] No source files were modified (this is a pure investigation spike)
- [ ] `pricing model exploration` includes at least 3 tiers with rationale

## STOP conditions

Stop and report back if:

- Any source file in `src/` was modified during this spike (you're investigating, not building)
- The existing Stripe/Payfast infrastructure is not a remnant but actually in use somewhere (check call sites with `grep -rn "stripe\|payfast" src/ --include "*.ts" --include "*.tsx"`)
- School licensing is explicitly out of scope per project direction found in any project doc

## Maintenance notes

- This spike is a prerequisite for any future monetization work. The data model and API design will guide all subsequent billing implementation.
- The teacher tools (plan 099) naturally converge with this work — teachers are the distribution channel, schools are the customer.
- Pricing decisions here affect what goes into the business metrics dashboard (plan 100).
