# School Licensing — Existing Monetization Infrastructure Audit

**Date:** 2026-07-05
**Status:** Design Spike (Plan 098)

## Summary

All previous premium/billing infrastructure is completely dead code. Premium gating was removed wholesale in Session 36 (commit `26635245`). The codebase has zero active references to Stripe or Payfast. No billing collections exist in Appwrite or Dexie schemas.

## What Exists (dead)

### Spec Documents

| File | Status |
|---|---|
| `docs/superpowers/specs/2026-05-27-monetization-end-to-end.md` | Approved spec for Stripe + Payfast integration. Describes webhook, premium sync, cancel flow, monthly pricing. Never fully implemented — the webhook route and Payfast checkout routes were never created. |

### Environment Variables (`.env.example` lines 41-54)

```env
# Stripe (premium subscriptions)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Payfast (premium subscriptions - SA)
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_RETURN_URL=
PAYFAST_CANCEL_URL=
PAYFAST_NOTIFY_URL=
```

These vars are documented but unused — no code loads them.

### Dependencies

- `stripe@22.2.0` is NOT in `package.json` (was never installed; the spec said "install stripe" but no commit did)
- Payfast is server-to-server MD5-signed POST — no SDK dependency needed
- Stripe SDK would need to be installed before any webhook work

### What Exists (alive, reusable)

| Component | File | Lines | Notes |
|---|---|---|---|
| Teacher service | `src/lib/server/teacher-service.ts` | 273 | Real Appwrite-backed service. Methods: `getStudents()`, `getTopicMastery()`, `getEngagementStats()`, `assignToStudent()`, `linkStudentToTeacher()`, `getRecentActivity()` |
| Teacher API routes | `src/app/api/teacher/` | 7 routes | Students, topics, engagement, assignments, observations, ghost links, reports |
| Parent dashboard | `src/app/[locale]/parent/` | — | Child selector, activity timeline, weekly report panel |
| Ghost links | `POST /api/teacher/ghost-link` | — | 30-day aggregate stats, marketing funnel for school sales |
| Weekly digest | `POST /api/cron/weekly-digest` | — | Admin-triggered push notification digest — could extend to school-level billing reports |

### What Does NOT Exist (gaps)

| Item | Status |
|---|---|
| Stripe webhook route | **Never created** — spec defined it but it was never built |
| Payfast checkout route | **Never created** — spec defined it but it was never built |
| Payfast IPN handler | **Never created** — spec defined it but it was never built |
| Premium sync on load | **Removed in S36** — was in `premium-context.tsx`, now deleted |
| PremiumCancel component | **Removed in S36** |
| PremiumGate / ContentLock | **Removed in S36** — was in 4 components, all deleted |
| `/premium` page | **Removed in S36** — nav config has no `/premium` route |
| `premium_subscriptions` Appwrite collection | **Never created** — no collection constant in `src/lib/db/` |
| Billing Appwrite collections | **None** — no `schools`, `licenses`, `invoices` schemas exist |
| Stripe SDK (`stripe` npm package) | **Not installed** |

## Assessment

The old premium model was B2C individual subscriptions. The new model is B2B2C school/district licensing. The only reusable assets are:

1. **Teacher service** — needs a `schoolId` field on teacher-student links and school-scoped queries
2. **Ghost links** — can serve as a marketing funnel (school admin sees aggregate stats before purchasing)
3. **Weekly digest** — infrastructure for school-level billing notifications

Everything else — collections, routes, UI, SDK — must be built from scratch.
