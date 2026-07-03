# Plan 086: Fix referral reward loop — replace premium promise with XP + streak rewards

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a72e64df..HEAD -- src/components/settings/tabs/referral-tab.tsx src/app/api/referral/ src/app/api/auth/verify/route.ts src/lib/referral/ src/components/referral/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Planned at**: commit `a72e64df`, 2026-07-03

## Why this matters

The referral system has a complete viral loop infrastructure: referral code generation, sharing (QR, link, share sheet), claiming (POST /api/referral/claim), and status tracking. When a referee verifies their email, their referral status transitions to "rewarded" (via `auth/verify/route.ts:21`). But the reward itself was "7 days of Premium" — and Premium was made free in Session 36 (commit `2d0b57b`). The `REFERRAL_REWARD_DAYS = 7` constant is sent in API responses and displayed in UI, but no code actually delivers premium days.

The UI still says "Premium earned" and "Both get Premium" language. Students who refer friends see `status: "rewarded"` but get nothing. This is a broken UX promise that actively harms trust for the most engaged users (those motivated enough to share with friends).

## Current state

- `src/lib/referral/constants.ts:1` — `REFERRAL_REWARD_DAYS = 7`
- `src/app/api/referral/claim/route.ts:49` — returns `rewardDays: REFERRAL_REWARD_DAYS` in claim response
- `src/app/api/auth/verify/route.ts:21,25` — calls `updateReferralStatus(userId, "rewarded")`, redirects with `reward=${REFERRAL_REWARD_DAYS}` query param
- `src/lib/referral/service.ts:63-77` — `updateReferralStatus()` correctly sets `status: "rewarded"` + `rewardedAt` timestamp
- `src/components/settings/tabs/referral-tab.tsx:52,130` — displays `rewardedCount` and shows "Premium earned" / "Pending verification" per-referral labels
- Premium gating was removed in Session 36 — there is no `usePremium()` or `isPremium` check anywhere
- 11 Stripe/Payfast env vars remain documented in `.env.example` but unreferenced in code

## STOP conditions

- The `updateReferralStatus()` function has callers other than `auth/verify/route.ts` that rely on the current status format
- The referral page renders in an authenticated context (it does — Settings is auth-gated)

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`            | exit 0, no errors   |
| Tests     | `pnpm run test -- referral`     | all pass            |
| Lint      | `pnpm exec biome check --write` | exit 0              |

## Scope

**In scope**:

- Choose a deliverable reward: **XP bonus** (e.g., 500 XP for referrer + 250 XP for referee on email verification) is the simplest because the gamification engine already supports `addXp()` mutations. The reward fires in the `updateReferralStatus` code path.
- `src/app/api/auth/verify/route.ts` — after `updateReferralStatus`, call gamification service to award XP to both referrer and referee
- `src/app/api/referral/claim/route.ts` — change `rewardDays` in response to `xpReward` or remove the field
- `src/components/settings/tabs/referral-tab.tsx` — replace "Premium earned" → "XP earned" / "Reward claimed"; replace "Both get Premium" → "Both earn bonus XP"
- `src/lib/referral/constants.ts` — replace `REFERRAL_REWARD_DAYS` with `REFERRAL_REWARD_XP_REFERRER = 500`, `REFERRAL_REWARD_XP_REFEREE = 250`

**Out of scope**:

- Stripe/Payfast env var cleanup in `.env.example` (cosmetic, not broken)
- Referral analytics dashboard (nice-to-have, not broken)
- Multi-tier referral rewards (e.g., 3 referrals = more XP)

## Steps

### Step 1: Choose reward and update constants

Open `src/lib/referral/constants.ts`. Replace:

```ts
export const REFERRAL_REWARD_DAYS = 7;
```

with:

```ts
export const REFERRAL_REWARD_XP_REFERRER = 500;
export const REFERRAL_REWARD_XP_REFEREE = 250;
```

### Step 2: Update claim route response

Open `src/app/api/referral/claim/route.ts`. Replace `rewardDays: REFERRAL_REWARD_DAYS` with `xpReward: REFERRAL_REWARD_XP_REFEREE` (the referee gets the amount shown at claim time).

### Step 3: Wire XP reward in verification route

Open `src/app/api/auth/verify/route.ts`. After the `updateReferralStatus` call, look up the referrer's ID from the referral record and call the gamification service to award XP to both users:

```ts
import { gamificationService } from "@/lib/gamification-engine/service";

// In the verification success block:
const referral = await getReferralByReferee(userId);
if (referral && referral.status === "pending") {
  await updateReferralStatus(userId, "rewarded");
  // Award XP to referee
  await gamificationService.addXp(userId, REFERRAL_REWARD_XP_REFEREE, "referral");
  // Award XP to referrer
  await gamificationService.addXp(referral.referrerId, REFERRAL_REWARD_XP_REFERRER, "referral");
}
```

Handle the case where `addXp` fails (log error, don't fail the verification).

### Step 4: Update referral tab UI text

Open `src/components/settings/tabs/referral-tab.tsx`. Replace:

- "Premium earned" → "Reward claimed" (or "XP earned")
- "Pending verification" → "Pending — verify email to claim"
- Any "Both get Premium" text → "Both earn bonus XP on signup"

Update the `rewardedCount` display to show XP amounts if visible.

### Step 5: Run typecheck + tests

Run `pnpm run typecheck` — 0 errors. Run `pnpm run test -- referral` — all pass. Run `pnpm exec biome check --write` — 0 errors on changed files.

## Verification

1. Referral claim flow: claim → verify → both users' XP increases by the correct amounts
2. Referral tab shows updated text (no "Premium" mentions)
3. All existing referral tests pass
4. `grep -r "REFERRAL_REWARD_DAYS"` returns 0
