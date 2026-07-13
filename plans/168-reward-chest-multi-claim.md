---
status: TODO
priority: P2
effort: S
risk: LOW
confidence: MED
created: 2026-07-12
commit: 4fcd46a4
---

# 168 — Reward chest loop claims only the first eligible chest

## Context

`checkAndClaimRewardChest` returns inside the loop on the first eligible chest, and `checkForRewardChestsMutation` calls it exactly once. If a single quiz/exam/flashcard session earns enough XP to cross ≥2 chest thresholds at once, only the first chest's XP/achievement is awarded; the rest stay unclaimed until a later `checkForRewardChests` call — and if the user stops doing activities, that XP is never delivered.

## Current state (verified)

`src/lib/gamification-engine/gamification-engine.ts:193-215`

```ts
checkAndClaimRewardChest(data: StoredGamification): { data; chest } {
  const claimedIds = new Set(data.claimedChests.map((c) => c.id));
  for (const chest of REWARD_CHESTS) {
    if (!claimedIds.has(chest.id) && data.totalXp >= chest.xpRequired) {
      return { data: { ...data, xp: data.xp + chest.xpReward, totalXp: data.totalXp + chest.xpReward, claimedChests: [...] }, chest };
    }
  }
  return { data, chest: null };
}
```

`src/lib/gamification-engine/service-mutation.ts:105-117` — `checkForRewardChestsMutation` invokes it once and returns.

## Goal

Claim **all** due chests in one pass (loop until no eligible chest remains), accumulating XP.

## Steps

1. Rewrite `checkAndClaimRewardChest` to not early-return on the first match:
   - Start from `let result = data; const claimed: ChestDef[] = [];`
   - Loop over `REWARD_CHESTS`; for each unclaimed chest where `result.totalXp >= chest.xpRequired`, apply its reward to `result` and push to `claimed`.
   - After the loop, return `{ data: result, chest: claimed[claimed.length - 1] ?? null }` (or an array if callers need all — see step 2).
2. Check all callers of `checkAndClaimRewardChest` / `checkForRewardChests` (search `checkForRewardChests`, `checkAndClaimRewardChest`) to see if they rely on a single `chest` return value (e.g. for a toast). If a single chest is needed for UI, returning the last claimed is fine; otherwise return the array. Keep the public `checkForRewardChests()` method on the engine behavior-compatible (claims all).
3. Ensure the loop terminates: each claim adds `chest.xpReward` to `totalXp` but a chest is only claimable once (`claimedIds`/`claimedChests` guard), so no infinite loop.
4. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/lib/gamification-engine/gamification-engine.ts`, `service-mutation.ts`, any caller relying on the return value.
- Out of scope: chest threshold definitions (`REWARD_CHESTS`), achievement unlocking logic.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/lib/gamification-engine` → pass (add/extend a test: seed gamification with `totalXp` above 2 thresholds, call `checkForRewardChests`, assert both chests claimed and XP summed).

## Test plan

- Extend `src/lib/gamification-engine/__tests__/*` (engine tests): construct `StoredGamification` with `totalXp` exceeding two chest thresholds, call `checkAndClaimRewardChest`, assert `claimedChests.length === 2` and `xp`/`totalXp` increased by the sum of both `xpReward`.

## Maintenance

- If a new UI feature shows "chest unlocked" toasts, it should iterate over all claimed chests (or use the returned array) so multi-claims are surfaced.

## Escape hatches

- If any caller destructures a single `chest` and would break with multiple, return the last claimed for backward-compat and note it in the PR. Do not change unrelated achievement logic.
