# 184 — Fix `duration: prefersReducedMotion ? 0 : X` reduced-motion pattern

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 15 files, ~30 lines

## Problem

24 occurrences across the codebase use `transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}` to handle reduced motion. Setting `duration: 0` still triggers Motion's full animation lifecycle — the element interpolates from `initial` to `animate` but at 0ms speed. This can cause:

1. A positional flicker as Motion applies `initial` styles and immediately teleports to `animate`.
2. Unnecessary layout/performance work (Motion still computes the animation).
3. `AnimatePresence` exit animations may still play out in some Motion versions.

The correct pattern is branching the `initial`, `animate`, and `transition` props to `undefined` so Motion skips the animation entirely.

**Correct pattern** (used in 4 files already):

```typescript
initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
transition={prefersReducedMotion ? undefined : { duration: 0.3 }}
```

**Incorrect pattern** (24 occurrences):

```typescript
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
```

Affected files (abridged):

- `flashcards-idle.tsx:42`
- `flashcard-browse-client.tsx:143`
- `hero-section.tsx:117`
- `dictionary-client.tsx:168,181,271,289`
- `pronunciation-client/index.tsx:52`
- `study-browser-client.tsx:92`
- `problems-client.tsx:76,131,292`
- `search-widget.tsx:31`
- `theme-switcher.tsx:61`
- `lessons-page-client.tsx:20`
- `learn-page-client.tsx:70,98`
- `support-client.tsx:46`
- `quiz-view.tsx:90,279`
- `mcq-options.tsx:44-53,87-89`

## Target

Move the `prefersReducedMotion` check from `transition.duration` to `initial`/`animate`/`transition` props. When reduced motion is active, set `initial={undefined}` (keeps the natural DOM state), `animate={undefined}` (no animation), and `transition={undefined}`.

## Repo conventions to follow

- The correct pattern is already used in 4 files — see `quiz-view.tsx:90` (`duration: prefersReducedMotion ? 0 : undefined`), `dashboard-content.tsx:69`, `onboarding-client.tsx:169-176`, and `QuestionCardFeedback.tsx:121,139,154`.
- Use `useReducedMotion()` from `"motion/react"` — already imported in all affected files.

## Steps

For each file, apply this transformation pattern:

**Before**:

```typescript
<m.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: motionEase }}
>
```

**After**:

```typescript
<m.div
  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
  transition={prefersReducedMotion ? undefined : { duration: 0.3, ease: motionEase }}
>
```

Files to fix (by priority):

1. `quiz-view.tsx:90` — currently `duration: prefersReducedMotion ? 0 : undefined` — change to `transition={prefersReducedMotion ? undefined : { duration: undefined }}`
   - Also fix line 279: `transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}`
2. `flashcards-idle.tsx:42` — branch `initial`, `animate`, `transition`
3. `flashcard-browse-client.tsx:143` — branch `initial`, `animate`, `transition`
4. `dictionary-client.tsx:168,181,271,289` — branch all 4
5. `problems-client.tsx:76,131,292` — branch all 3
6. `learn-page-client.tsx:70,98` — branch both
7. `pronunciation-client/index.tsx:52` — branch
8. `study-browser-client.tsx:92` — branch
9. `lessons-page-client.tsx:20` — branch
10. `support-client.tsx:46` — branch
11. `search-widget.tsx:31` — branch
12. `theme-switcher.tsx:61` — branch
13. `mcq-options.tsx:44-53,87-89` — branch both

## Boundaries

- Do NOT change the animation values themselves (durations, easings) — only how reduced motion is handled.
- Do NOT remove `useReducedMotion()` imports.
- Do NOT add new imports or dependencies.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Feel check**: Enable `prefers-reduced-motion: reduce` in DevTools Rendering panel. Navigate the app — all elements should appear in their final state immediately with NO entrance animation (no flicker, no positional jump).
- **Done when**: No file uses `duration: prefersReducedMotion ? 0 :` pattern. All use the `undefined` branching pattern.
