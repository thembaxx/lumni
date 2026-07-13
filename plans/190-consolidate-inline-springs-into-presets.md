# 190 — Consolidate inline springs into `springPresets`

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens
- **Estimated scope**: 6 files, ~15 lines

## Problem

Seven inline spring configurations across 5 files define their own stiffness/damping values that drift from the 4 shared `springPresets`. This creates fragmentation — each component feels slightly different.

| File                     | Line  | Values                                              | Nearest preset  | Drift                             |
| ------------------------ | ----- | --------------------------------------------------- | --------------- | --------------------------------- |
| `admin-dashboard.tsx`    | 152   | `stiffness: 500, damping: 26, bounce: 0`            | fast=400/28     | +100 stiffness, −2 damping        |
| `top-nav.tsx`            | 91    | `stiffness: 200, damping: 20, bounce: 0`            | slow=200/24     | −4 damping                        |
| `bottom-nav.tsx`         | 96    | `stiffness: 400, damping: 26, bounce: 0`            | fast=400/28     | −2 damping                        |
| `success-badge.tsx`      | 33,56 | `stiffness: 400, damping: 26, bounce: 0`            | fast=400/28     | −2 damping                        |
| `achievement-unlock.tsx` | 41    | `stiffness: 200, damping: 14, bounce: 0.25`         | slow=200/24     | −10 damping, +0.25 bounce         |
| `achievement-unlock.tsx` | 52    | `stiffness: 300, damping: 24`                       | standard=300/26 | −2 damping                        |
| `mcq-options.tsx`        | 49-52 | `stiffness: 300, damping: 26, mass: 0.8, bounce: 0` | standard=300/26 | **exact match** — fully redundant |

The `mcq-options.tsx` case is a direct inline copy of `springPresets.standard` — it should simply import and use the preset.

## Target

Replace each inline spring config with the closest matching `springPresets` preset. For cases where the drift is meaningful (e.g., `achievement-unlock.tsx` with visible bounce), add a new preset to `springPresets` or document why the inline value is necessary.

**Recommended consolidation**:

- `admin-dashboard.tsx:152` → `springPresets.fast` (drift is likely unintentional)
- `top-nav.tsx:91` → `springPresets.slow` (drift is likely unintentional)
- `bottom-nav.tsx:96` → `springPresets.fast` (drift is likely unintentional)
- `success-badge.tsx:33,56` → `springPresets.fast` (drift is likely unintentional)
- `achievement-unlock.tsx:41` → add new preset `bouncy: { stiffness: 200, damping: 14, mass: 1, bounce: 0.25 }` (intentional bounce — deserves a named preset)
- `achievement-unlock.tsx:52` → `springPresets.standard` (drift is likely unintentional)
- `mcq-options.tsx:49-52` → `springPresets.standard` (exact match — redundant)

## Repo conventions to follow

- `springPresets` is defined in `src/lib/utils/spring-presets.ts` and exported as named export.
- All presets use the `{ type: "spring", stiffness, damping, mass, bounce }` shape with `type: "spring" as const`.
- Add new presets to the `springPresets` object, not as separate exports.

## Steps

1. Open `src/lib/utils/spring-presets.ts`. Add a new `bouncy` preset (for achievement celebrations):

   ```typescript
   bouncy: { type: "spring" as const, stiffness: 200, damping: 14, mass: 1, bounce: 0.25 },
   ```

2. Open `src/components/admin/admin-dashboard.tsx:152`. Replace the inline spring config with `springPresets.fast`.

3. Open `src/components/navigation/top-nav.tsx:91`. Replace with `springPresets.slow`.

4. Open `src/components/navigation/bottom-nav.tsx:96`. Replace with `springPresets.fast`.

5. Open `src/components/auth/success-badge.tsx:33,56`. Replace both with `springPresets.fast`.

6. Open `src/components/celebration/achievement-unlock.tsx:41`. Replace with `springPresets.bouncy`. Line 52: replace with `springPresets.standard`.

7. Open `src/components/quiz/parts/mcq-options.tsx:49-52`. Replace the inline spring object with `springPresets.standard`.

## Boundaries

- Do NOT change any other animation properties (duration, delay, etc.) — only the spring configs.
- Do NOT change the easing of non-spring transitions in these files.
- Do NOT remove the `type: "spring" as const` pattern from springPresets.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Feel check**: Trigger each affected component — the motion should be visually very similar to before. The `mcq-options.tsx` change should be imperceptible (exact same values). The others may feel subtly different but within the same spring family.
- **Done when**: `springPresets` has a `bouncy` preset, and all 7 inline spring configs reference a preset instead of defining their own values.
