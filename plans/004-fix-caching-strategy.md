# Plan 004: Fix caching strategy to read tiers sequentially

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/caching-strategy/caching-strategy.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

The `CachingStrategy.resolve()` reads all cache tiers in parallel via `Promise.allSettled`, meaning it waits for both the fast local Dexie tier AND the slow remote Appwrite tier before returning. When Dexie has the data (the common case for offline-first), users still wait 200-800ms for the Appwrite HTTP round-trip to resolve. This is on the hot path for every quiz generation and knowledge graph lookup.

## Current state

**`src/lib/caching-strategy/caching-strategy.ts:34-52`**:
```typescript
async resolve(params: P): Promise<T | null> {
  const results = await Promise.allSettled(
    this.tiers.map((tier) => tier.read(params)),
  );
  for (const [i, result] of results.entries()) {
    if (
      result.status === "fulfilled" &&
      result.value !== null &&
      result.value !== undefined
    ) {
      return result.value;
    }
    if (result.status === "rejected") {
      console.warn(
        `Cache read from tier ${this.tiers[i]?.name ?? i} failed:`,
        result.reason,
      );
    }
  }
  // ... generate and write back
}
```

The `Promise.allSettled` resolves only when ALL promises settle. Even if Dexie returns instantly, the function blocks on Appwrite.

**Repo convention**: The system is offline-first. Dexie is always the first tier, Appwrite is second. See CONTEXT.md: "All reads hit Dexie first."

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check src/lib/caching-strategy/caching-strategy.ts` | 0 errors |
| Tests     | `bun run test`           | 1326+ pass, 0 fail  |

## Scope

**In scope**:
- `src/lib/caching-strategy/caching-strategy.ts`

**Out of scope**:
- Consumers of `CachingStrategy` (question-engine, knowledge-graph, etc.)
- Tier implementations (DexieDataAccess, Appwrite)

## Git workflow

- Branch: `advisor/004-fix-caching-strategy`
- Commit: `perf: read cache tiers sequentially — return on first hit`

## Steps

### Step 1: Read tiers sequentially, return on first hit

Replace the `Promise.allSettled` parallel read with a sequential loop that returns immediately on the first cache hit:

```typescript
async resolve(params: P): Promise<T | null> {
  // Read tiers sequentially — return on first hit
  for (const tier of this.tiers) {
    try {
      const value = await tier.read(params);
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch (e) {
      console.warn(`Cache read from tier ${tier.name} failed:`, e);
    }
  }

  const generated = await this.generator.generate(params);
  if (generated !== null && generated !== undefined) {
    await Promise.allSettled(
      this.tiers.map((t) =>
        t
          .write(params, generated)
          .catch((e) => console.warn(`Cache write to ${t.name} failed:`, e)),
      ),
    );
  }

  return generated;
}
```

Note: the write-back can remain parallel (`Promise.allSettled`) since we don't block the user on writes.

**Verify**: `npx biome check src/lib/caching-strategy/caching-strategy.ts` → 0 errors

### Step 2: Run full verification

```bash
npx tsc --noEmit
npx biome check src/lib/caching-strategy/caching-strategy.ts
bun run test
```

## Test plan

- If `src/lib/caching-strategy/__tests__/caching-strategy.test.ts` exists, verify it covers sequential read behavior.
- If not, add a test:
  - Tier 1 returns value → resolve returns immediately, Tier 2 not called
  - Tier 1 returns null, Tier 2 returns value → resolve returns Tier 2's value
  - Tier 1 throws → resolve continues to Tier 2
  - All tiers miss → generator called, result written to all tiers

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/caching-strategy/caching-strategy.ts` exits 0
- [ ] `bun run test` exits 0
- [ ] `grep -n "Promise.allSettled" src/lib/caching-strategy/caching-strategy.ts` returns no matches in the `resolve` method (write-back parallel is OK)
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- Consumers depend on the parallel read behavior (e.g., they expect all tiers to be read for side effects).
- The write-back `Promise.allSettled` is in the `resolve` method (keep it — only the read path changes).

## Maintenance notes

- If a future tier is added between Dexie and Appwrite (e.g., Redis), it will be checked sequentially — this is the correct behavior.
- The `CacheTier` interface's `read` method must not have side effects beyond returning a value.
