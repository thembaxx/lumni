# Advisor Plan 004: Remove or use `@effect/platform` unused dependency

> **Source**: Audit finding PERF-01
> **Priority**: P3
> **Effort**: S (remove from package.json, or add first usage)
> **Risk**: LOW
> **Confidence**: HIGH

## Why this matters

`@effect/platform` was added as part of ADR-0013 (Effect adoption) but has zero imports across the entire codebase (confirmed by knip). It adds ~15KB to the bundle for nothing. Either:

A. **Remove it** — clean up deps, reduce install time and bundle
B. **Add first usage** — the canonical pattern is `@effect/platform` `HttpClient` for typed HTTP effects

Per ADR-0013: "HTTP: use `@effect/platform` `HttpClient` for typed HTTP effects." No codebase consumer has adopted this yet.

## Current state

- `package.json` has `"@effect/platform": "^0.96.2"` in dependencies
- `grep -r "@effect/platform" src/` returns zero results
- knip reports it as unused

## Recommendation

**Option A (remove)** — safer, cleaner. The ADR can be updated once a real consumer emerges. But this creates an inconsistency: ADR-0013 says to use it, but it's not installed.

**Option B (add first usage)** — more aligned with ADR-0013. Replace one existing HTTP fetch call in an Effect-based module with `HttpClient`. Best candidate: `src/lib/tinyfish/client.ts` (thin HTTP wrapper, already Effect-based).

If Option B: The TinyFish client does:

```typescript
const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
```

This could be replaced with:

```typescript
import { HttpClient } from "@effect/platform";
// ... use HttpClient.request() with timeout
```

## Steps (Option A — Remove)

1. Remove `"@effect/platform": "^0.96.2"` from `package.json`
2. `pnpm install` → clean install
3. `pnpm run typecheck` → exit 0
4. `pnpm run test` → all pass

## Steps (Option B — Add usage)

1. Refactor `src/lib/tinyfish/client.ts` to use `@effect/platform` `HttpClient`
2. Verify all callers still work
3. `pnpm run typecheck` → exit 0
4. `pnpm run test` → all pass

## Done criteria

- [ ] Either removed from package.json OR first usage added
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] knip no longer reports `@effect/platform` as unused
