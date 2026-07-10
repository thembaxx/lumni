# Plan 159: Consolidate alert/notification timer constants

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the list.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/lib/shared/ constants/`
> If relevant constants files changed since this plan was written, treat it as
> a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

Auto-dismiss timestamps for alert/notification/toast components are hardcoded
as inline numeric literals (~15 distinct values across ~10 files): `3000`,
`4000`, `5000`, `8000`, `10000`, `2000`, `1500`, `60000`, etc. Some are in
milliseconds, some in seconds. Some are inside JSX, some in `useEffect` d
dependencies. When a designer adjusts the toast duration during UX review,
every inline value must be found and changed individually. Consolidating into
named constants makes the timing semantic, enables bulk changes, and prevents
a future source of drift.

## Current state

Find all inline numeric timer values that control auto-dismiss:

```bash
# Search for common auto-dismiss patterns
rg '(setTimeout|setInterval)\(\s*[,\)]' src/ --include '*.{ts,tsx}'
# Look for common toast/alert auto-dismiss values
rg '(3000|4000|5000|8000|10000|2000|1500)' src/components/ --include '*.{tsx,ts}'
```

Likely suspects include: toast notifications, celebration overlays,
clipboard-copied confirmation, daily bolt celebration, error banners,
success messages, loading spinners with timeout fallback.

## Scope

**In scope**:

- `src/lib/shared/durations.ts` (create — named constants)
- ~10 files that use inline timer literals for auto-dismiss (edit)

**Out of scope**:

- Do NOT consolidate animation durations (`transition-duration`,
  `animate-duration` CSS)
- Do NOT touch polling intervals (`useInterval`, `setInterval` for
  data refresh)
- Do NOT touch debounce/throttle timers
- Do NOT touch rate-limit time windows

## Git workflow

- Branch: `advisor/159-consolidate-alert-timers`
- Commit message: `refactor: consolidate auto-dismiss timers into named constants`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Identify all inline auto-dismiss timer values

```bash
rg '(setTimeout|setInterval)\(\s*[,\)]' src/ --include '*.{ts,tsx}' -n
rg '(3000|4000|5000|8000|10000|2000|1500|60000)' src/components/ --include '*.{tsx,ts}' -n
rg '(3000|4000|5000|8000|10000|2000|1500|60000)' src/lib/ --include '*.{ts,tsx}' -n
```

Review each match. Classify as:

- ✅ In scope: auto-dismiss timers (toast closes, celebration ends, banner
  disappears, clipboard confirmation hides, loading fallback, "saved" indicator)
- ❌ Out of scope: animation durations, polling intervals, debounce, rate-limit

### Step 2: Create the constants file

Create `src/lib/shared/durations.ts`:

```typescript
/** Duration constants for all auto-dismiss behaviours. All values in
 * milliseconds unless otherwise noted. */

/** Toast/notification auto-dismiss after a success action */
export const TOAST_DURATION = 4000;

/** Error toast/banner auto-dismiss (longer to allow reading) */
export const ERROR_TOAST_DURATION = 8000;

/** Celebration overlay auto-dismiss */
export const CELEBRATION_DURATION = 8000;

/** Clipboard "Copied" confirmation auto-dismiss */
export const CLIPBOARD_CONFIRMATION_DURATION = 2000;

/** Inline "Saved" indicator auto-dismiss */
export const SAVED_INDICATOR_DURATION = 1500;

/** Loading spinner timeout fallback (show error if loading takes too long) */
export const LOADING_TIMEOUT = 10000;

/** Success banner auto-dismiss */
export const SUCCESS_BANNER_DURATION = 5000;

/** Transition delay before auto-dismiss fade-out begins */
export const DISMISS_DELAY = 300;
```

Add only the constants that match actual usage in the codebase (from Step 1).
Adjust names and values to match existing conventions.

### Step 3: Update importers

For each file identified in Step 1 that is in scope:

1. Import the relevant constant(s) from `@/lib/shared/durations`
2. Replace the inline numeric literal with the constant name

Example:

```typescript
// Before
setTimeout(() => setShow(false), 4000);

// After
import { TOAST_DURATION } from "@/lib/shared/durations";
setTimeout(() => setShow(false), TOAST_DURATION);
```

**Verify**: `pnpm run typecheck` → exit 0

### Step 4: Verify no regressions

Run the full test suite:

```bash
pnpm run test
```

If any test asserts on the millisecond value (unlikely but possible in toast
component tests), update the assertion.

## Test plan

- No new tests needed for the constants file itself (it's pure data).
- If toast/celebration/alert tests exist and they assert on timer values,
  update them to import and use the constant.
- Run existing tests — no regressions expected.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, no regressions
- [ ] `pnpm exec oxlint` — zero warnings on all changed files
- [ ] `src/lib/shared/durations.ts` exists with 8+ named constants
- [ ] No file under `src/` contains an inline `4000` (for toast) or `2000`
      (for clipboard) that is an auto-dismiss timer (hard to guarantee 100%
      without manual review of every match, but the grep above should be
      exhaustive enough)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Some inline values are conditional (e.g., `duration ?? 4000`). These should
  still be replaced: `duration ?? TOAST_DURATION`.
- A file has more than 10 replacements in a single file — consider extracting
  a local constant instead of importing if it's a one-off component.
- The same file uses several different values (e.g., 2000ms, 4000ms, and
  8000ms in the same toast component) — that's fine, import all three.

## Maintenance notes

- Any new component with an auto-dismiss timer should import from
  `src/lib/shared/durations.ts` rather than inlining.
- If UX feedback changes a timing globally, only `durations.ts` needs to
  change.
- The `DISMISS_DELAY` (300ms) is for the fade-out animation, not the
  auto-dismiss itself. Distinguish between: "how long until it starts to
  fade" (delay) vs "how long until it's gone" (duration).
