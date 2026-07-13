# 191 — Add subtle initial transform to pure-fade entrances

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: LOW
- **Category**: Physicality & origin
- **Estimated scope**: 4 files, ~8 lines

## Problem

Eight Motion entrance animations use pure-opacity fades (`initial={{ opacity: 0 }}` / `animate={{ opacity: 1 }}`) with **no initial transform**. AUDIT.md §3: "Never scale(0) — nothing in the real world appears from nothing. Target: scale(0.9–0.97) + opacity: 0." Elements that fade in without spatial context feel disconnected — they teleport into place rather than emerging from a nearby position.

Affected locations:

- `src/components/tools/tool-workbench.tsx:340-342` — VoidDot easter egg visibility toggle
- `src/app/[locale]/study-guide/study-guide-content.tsx:136-138` — empty state
- `src/app/[locale]/study-guide/study-guide-content.tsx:152-155` — skeleton loading container
- `src/app/[locale]/study-guide/study-guide-content.tsx:171-174` — error state
- `src/app/[locale]/study-guide/study-guide-content.tsx:182-185` — results container
- `src/components/shared/stat-card.tsx:59-61` — admin variant value text
- `src/components/shared/stat-card.tsx:101-103` — dashboard variant value span
- `src/components/dashboard/practice/exams-browse/exam-loading-state.tsx:8-10` — skeleton loading state

## Target

Add a subtle `y: 8` or `scale: 0.97` to the `initial` state. The element should fade in while emerging from a slightly offset position, creating spatial continuity:

```typescript
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: motionEase }}
```

For the stat-card value text, use `scale: 0.97` (the number values "grow" into place):

```typescript
initial={{ opacity: 0, scale: 0.97 }}
animate={{ opacity: 1, scale: 1 }}
```

## Repo conventions to follow

- The standard entrance pattern in the codebase is `initial={{ opacity: 0, y: 8 }}` — used in `page-header.tsx`, `top-nav.tsx`, `category-overview.tsx`, etc.
- `y: 8` is the most common offset (12px is used for larger card entrances).
- `motionEase` from `@/lib/utils/animation` for the easing curve.

## Steps

1. Open `src/components/tools/tool-workbench.tsx`. Line 340: Change `initial={{ opacity: 0 }}` to `initial={{ opacity: 0, y: 8 }}`.

2. Open `src/app/[locale]/study-guide/study-guide-content.tsx`. Lines 136, 152, 171, 182: Change each `initial={{ opacity: 0 }}` to `initial={{ opacity: 0, y: 8 }}`.

3. Open `src/components/shared/stat-card.tsx`. Line 59 (admin variant): Change `initial={{ opacity: 0 }}` to `initial={{ opacity: 0, scale: 0.97 }}`. Line 101 (dashboard variant): Same change.

4. Open `src/components/dashboard/practice/exams-browse/exam-loading-state.tsx`. Lines 8-10: Change `initial={{ opacity: 0 }}` to `initial={{ opacity: 0, y: 8 }}`.

## Boundaries

- Do NOT change transition timing or easing — only add the transform to the `initial` state.
- Do NOT touch the stat-card's `whileHover`/`whileTap` props.
- Do NOT add new imports unless needed for the transition object.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Feel check**: Navigate to the study-guide page with an empty state — the "Select a subject and topic" message should gently rise into view instead of flatly appearing. Stat card number values should subtly grow into place.
- **Done when**: None of the 8 animated entrance elements use a pure `opacity: 0` initial state without a corresponding transform (`y`, `scale`, or `x`).
