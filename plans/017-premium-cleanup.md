# Plan 017: Remove dead premium infrastructure

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/components/ui/premium-gate.tsx src/lib/premium/ src/app/\[locale\]/premium/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

Session 36 removed all premium gating (all features are free), but ~400 lines of premium infrastructure remain: `PremiumGate` component (zero import sites), `PremiumProvider` context with `FREE_FEATURES` still limiting to 2 features, premium page with Stripe/Payfast checkout UI, and `withBudget` checks. The `FREE_FEATURES` list at `premium-context.tsx:35` defines only `["ai-tutor", "unlimited-flashcards"]` — meaning `hasFeature("advanced-analytics")` returns `false` for non-premium users, contradicting the "all features free" decision.

## Current state

**`src/components/ui/premium-gate.tsx`**: `PremiumGate` component, zero import sites (confirmed via grep).

**`src/lib/premium/premium-context.tsx:35`**:
```typescript
const FREE_FEATURES: PremiumFeature[] = ["ai-tutor", "unlimited-flashcards"];
```

**`src/lib/premium/premium-context.tsx:37-47`**:
```typescript
const PREMIUM_FEATURES: PremiumFeature[] = [
  "ai-tutor", "advanced-analytics", "unlimited-flashcards",
  "custom-study-plans", "exam-simulator", "priority-support",
  "offline-quiz-packs", "problem-library", "visual-engine",
];
```

**`src/app/[locale]/premium/premium-client.tsx`**: Full paid-tier features list and Stripe/Payfast checkout UI.

**Repo convention**: `hasFeature` is only used in the dead `premium-gate.tsx` and test files. No production code imports `PremiumGate`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check` on changed files | 0 errors |
| Tests     | `bun run test`           | 1326+ pass, 0 fail  |

## Scope

**In scope**:
- `src/components/ui/premium-gate.tsx` — delete
- `src/lib/premium/premium-context.tsx` — collapse `FREE_FEATURES` = `PREMIUM_FEATURES`
- `src/app/[locale]/premium/premium-client.tsx` — simplify or remove checkout UI

**Out of scope**:
- `src/lib/api/create-route-handler.ts` — `budget` field still works with collapsed features
- Stripe/Payfast API routes — may be needed for future monetization
- `src/lib/premium/` directory — keep the provider for `hasFeature` compatibility

## Git workflow

- Branch: "advisor/017-premium-cleanup"
- Commit: `chore: remove dead premium gating — all features free`

## Steps

### Step 1: Delete PremiumGate component

Delete `src/components/ui/premium-gate.tsx`. Verify no imports exist:

```bash
grep -rn "PremiumGate\|premium-gate" src/ --include="*.tsx" --include="*.ts"
```

Should return zero matches (excluding the deleted file itself).

### Step 2: Collapse FREE_FEATURES to equal PREMIUM_FEATURES

In `src/lib/premium/premium-context.tsx`:

```typescript
const FREE_FEATURES: PremiumFeature[] = [
  "ai-tutor", "advanced-analytics", "unlimited-flashcards",
  "custom-study-plans", "exam-simulator", "priority-support",
  "offline-quiz-packs", "problem-library", "visual-engine",
];
```

This makes `hasFeature()` return `true` for all features regardless of premium status.

### Step 3: Simplify premium page (optional)

If the premium page shows checkout UI for features that are already free, simplify it to a "thank you" or "all features are free" message. If this is too complex, skip it — the `hasFeature` fix is the critical change.

### Step 4: Run full verification

```bash
npx tsc --noEmit
npx biome check src/components/ui/premium-gate.tsx src/lib/premium/premium-context.tsx
bun run test
```

## Test plan

- Update `src/hooks/__tests__/use-premium.test.tsx`:
  - Verify `hasFeature` returns `true` for all features (not just `FREE_FEATURES`)
  - Remove tests that assert premium-gated behavior

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `bun run test` exits 0
- [ ] `grep -rn "PremiumGate" src/ --include="*.tsx" --include="*.ts"` returns zero matches
- [ ] `grep -n "FREE_FEATURES" src/lib/premium/premium-context.tsx` shows all 9 features
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `PremiumGate` is imported somewhere you didn't find (re-run grep).
- The `budget` field in `createRouteHandler` depends on `FREE_FEATURES` (it doesn't — it uses `PREMIUM_FEATURES` for budget limits).
- Removing `PremiumGate` breaks other components.

## Maintenance notes

- The `PremiumProvider` context is kept for backward compatibility — `usePremium()` may be used in future monetization.
- The `hasFeature` function is now a no-op (always returns true) but is kept for API stability.
- If the app re-introduces premium tiers, this plan's changes need to be reverted.
