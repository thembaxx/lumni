# 187 — Replace animated layout properties with transforms

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 4 files, ~20 lines

## Problem

Three components animate `height` and one animates `width` — layout properties that trigger synchronous layout measurement and forced reflows every frame:

**1-3. `animate={{ height: "auto" }}`** in 3 locations:

- `src/app/[locale]/questions/question-bank-client/index.tsx:119-121` — expandable answer
- `src/app/[locale]/problems/problems-client.tsx:128-130` — expandable solution
- `src/app/[locale]/problems/problems-client.tsx:290-291` — expandable difficulty section

Motion cannot animate to `"auto"` natively — it falls back to measuring `getBoundingClientRect()` synchronously on every toggle, causing a forced layout read.

**4. `animate={{ width: 0 → 260 }}`** in `question-navigator-sidebar.tsx:62-64`:

```typescript
<m.aside
  initial={{ width: 0, opacity: 0 }}
  animate={{ width: 260, opacity: 1 }}
  exit={{ width: 0, opacity: 0 }}
>
```

Animating `width` from `0` to `260` triggers layout recalculation because `width` is a layout property — it reflows sibling elements.

## Target

For `height: auto` toggles, use a transform alternative:

- **Option A**: `transform: scaleY(0→1)` with `transform-origin: top center` — visually collapses the element without layout reflow.
- **Option B**: Wrap with a `<div style="overflow: hidden">` and use `height` measured by a ref (less performant but preserves proper layout flow).

Option A is recommended for these specific cases since they're decorative expand/collapse elements.

For the sidebar `width` animation, use `x`/`translateX` instead:

```typescript
< m.aside
  initial={{ x: -260, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: -260, opacity: 0 }}
>
```

This keeps the sidebar in the layout flow (its container handles positioning) while animating only compositor properties.

## Repo conventions to follow

- The `overflow-hidden` pattern for scaleY reveals is standard in the codebase.
- Motion `initial`/`animate`/`exit` with `<AnimatePresence>` is the standard pattern.
- `springPresets.fast` for UI transitions (used in `list-cell.tsx:66`, `tab-switcher.tsx:129`, etc.).

## Steps

1. **question-bank-client/index.tsx** (3 locations, lines 119-121):

   **Before**:

   ```typescript
   <m.div
     initial={{ height: 0, opacity: 0 }}
     animate={{ height: "auto", opacity: 1 }}
     transition={{ duration: 0.3 }}
   >
   ```

   **After**:

   ```typescript
   <m.div
     initial={{ scaleY: 0, opacity: 0 }}
     animate={{ scaleY: 1, opacity: 1 }}
     transition={springPresets.fast}
     style={{ transformOrigin: "top center" }}
   >
   ```

2. **problems-client.tsx** (2 locations, lines 128-130 and 290-291) — same transform pattern.

3. **question-navigator-sidebar.tsx:62-64**:

   **Before**:

   ```typescript
   initial={{ width: 0, opacity: 0 }}
   animate={{ width: 260, opacity: 1 }}
   exit={{ width: 0, opacity: 0 }}
   ```

   **After**:

   ```typescript
   initial={{ x: -260, opacity: 0 }}
   animate={{ x: 0, opacity: 1 }}
   exit={{ x: -260, opacity: 0 }}
   ```

## Boundaries

- Do NOT change the component layout or markup — only the animation properties.
- Do NOT touch `AnimatePresence` or `showPalette` conditionals.
- Do NOT add new dependencies.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Performance check**: Open DevTools Performance panel. Toggle an expandable answer/solution. There should be NO purple Layout markers during the animation — only green Paint and white Composite markers.
- **Feel check**: Expand/collapse the sidebar — it should slide in/out smoothly. Expand a solution — it should reveal its content with a subtle transform reveal.
- **Done when**: No component animates `width` or `height` as a Motion property. All use `x`, `scaleY`, or `opacity`.
