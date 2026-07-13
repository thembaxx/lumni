# 193 — Add border-color transition to MCQ option selection

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: LOW
- **Category**: Missed opportunity
- **Estimated scope**: 1 file, ~1 line

## Problem

When a user selects an MCQ option, the `border-color` swaps instantly via a className change — no transition. The visual feedback snaps rather than flowing from the user's tap.

In `src/components/quiz/parts/mcq-options.tsx:62`:

```tsx
className={cn(
  "relative flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200",  // ← transition-all but no border-color
  isSelected
    ? "border-(--system-accent) bg-accent/10"  // ← border color swaps instantly
    : "border-border/40 bg-transparent",
)}
```

The `transition-all` class includes `border-color` implicitly, but some frameworks require explicit transition properties. The issue is that `className` swapping through React re-render doesn't go through CSS transitions in all cases — it depends on how the framework generates the CSS. With Tailwind's JIT, the class swap is effectively a CSS variable change, which `transition-all` should catch. However, since the class changes from `border-border/40` to `border-(--system-accent)`, these are different Tailwind utilities that may not be transitioned seamlessly.

## Target

Add `transition-[border-color]` explicitly alongside the existing `transition-all` to guarantee the border color animates smoothly. Or, if the issue is that the transform should be emphasized, ensure the full highlight animation (border + background + scale) feels connected.

```tsx
className={cn(
  "relative flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 motion-reduce:transition-none",
  isSelected
    ? "border-(--system-accent) bg-accent/10"
    : "border-border/40 bg-transparent",
)}
```

Since `transition-all` already includes `border-color`, the issue may be a timing problem — Motion's `animate` on the container overrides CSS transitions. The fix is to ensure the border color change happens during the spring animation of the MCQ option entrance, not as a separate CSS transition.

## Repo conventions to follow

- The codebase uses `transition-all` with caution (AUDIT §5 warns against it). However, `transition-all` is already used at this location and is acceptable for the MCQ option grid since the properties are limited.
- `motion-reduce:transition-none` is the standard reduced-motion pattern for CSS transitions.

## Steps

1. Open `src/components/quiz/parts/mcq-options.tsx`.
2. Line 62: Ensure the transition includes border-color changes. The current `transition-all duration-200` should handle this, but verify that the `motion-reduce` pattern is present:
   ```tsx
   "transition-all duration-200 motion-reduce:transition-none";
   ```
3. If the border-color change still feels instant, replace the conditional className approach with a Motion `animate` prop that interpolates border color:
   Add a motion wrapper with `animate={{ borderColor: isSelected ? "var(--system-accent)" : "var(--border)" }}` which gives Motion explicit control over the border color transition.

## Boundaries

- Do NOT change the MCQ option layout, text, or interaction logic.
- Do NOT change the stagger entrance animation timing.
- Do NOT affect the submit button transition.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Feel check**: Select an MCQ option in a quiz. The border color should smoothly transition to the accent color rather than snapping instantly. Deselect by choosing another option — the previous option's border should smoothly fade back.
- **Done when**: MCQ option border colors transition smoothly on selection change (not instant).
