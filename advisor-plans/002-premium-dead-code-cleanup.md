# Advisor Plan 002: Remove premium dead code (context + ContentLock + layout wrapper)

> **Source**: Audit findings ARCH-01, DIR-03
> **Priority**: P2
> **Effort**: S (hours)
> **Risk**: LOW — `usePremium()` returns `{ isPremium: true, hasFeature: () => true }`, deleting it is a no-op
> **Confidence**: HIGH

## Why this matters

Session 36 (June 2026) removed all premium gating from product features. However, cleanup was incomplete:

1. **`src/lib/premium/premium-context.tsx`** (46 lines) still exists — exports `PremiumProvider`, `usePremium()`, `PremiumFeature` type. All return `true`/`all features` unconditionally.
2. **`PremiumProvider` still wraps the app** in `src/app/[locale]/layout.tsx` — confirmed by two references found (provider definition + test mock).
3. **Test mock** in `src/hooks/__tests__/use-visual-engine.test.tsx` still mocks `PremiumProvider` — unnecessary if provider is gone.
4. **`ContentLock` component** — `search_files` confirms zero imports of `ContentLock` anywhere. The component may not exist as a file anymore (Session 36 may have deleted it), but if it does, it's dead.

This is dead code in the bundle, confusing mental model for new developers, and test mocks maintain the illusion.

## Current state

- `src/lib/premium/` directory exists with `premium-context.tsx`
- 0 imports of `@/lib/premium` found in any non-test source file
- 1 test mock in `use-visual-engine.test.tsx`
- `SearchDb` type in `search-service.ts` does NOT include premium tables — no consumers remain

## Steps

### Step 1: Delete `src/lib/premium/` directory

```
rm -rf src/lib/premium/
```

### Step 2: Remove `<PremiumProvider>` from layout

In `src/app/[locale]/layout.tsx`, remove the `<PremiumProvider>` wrapper. Verify no other files import it.

### Step 3: Remove test mock

In `src/hooks/__tests__/use-visual-engine.test.tsx`, remove the `PremiumProvider` mock entry.

### Step 4: Check for any barrel exports referencing premium

Search for any `export * from "@/lib/premium"` or re-exports in barrel files. Remove if found.

### Step 5: Check ContentLock component

If `src/components/ui/content-lock.tsx` exists, delete it.

### Verification

- `pnpm run typecheck` → exit 0
- `pnpm run test` → all pass
- `grep -r "premium" src/` → only false positives (variable names, not imports)
- `grep -r "PremiumProvider" src/` → zero results

## Done criteria

- [ ] `src/lib/premium/` directory deleted
- [ ] `<PremiumProvider>` removed from layout
- [ ] Test mock removed from `use-visual-engine.test.tsx`
- [ ] `ContentLock` component deleted if it exists
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Zero references to `PremiumProvider` or `usePremium` in source files
