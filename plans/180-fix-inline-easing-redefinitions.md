# 180 — Fix inline easing redefinition in flashcard pages

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: HIGH
- **Category**: Easing & duration
- **Estimated scope**: 2 files, ~4 lines

## Problem

Two flashcard page files define their own `motionEase` constant with a **different value** from the canonical easing in `animation.ts`:

**File 1**: `src/app/[locale]/flashcards/flashcards-idle.tsx:21`

```typescript
const motionEase = [0.25, 0.1, 0.25, 1] as const;
```

**File 2**: `src/app/[locale]/flashcards/browse/flashcard-browse-client.tsx:62`

```typescript
const motionEase = [0.25, 0.1, 0.25, 1] as const;
```

Canonical easing in `src/lib/utils/animation.ts:4`:

```typescript
export const motionEase: [number, number, number, number] = [0.175, 0.885, 0.32, 1.1];
```

The inline `[0.25, 0.1, 0.25, 1]` is a slow, symmetrical ease-in-out — it starts slow and ends slow. The canonical `[0.175, 0.885, 0.32, 1.1]` is a fast-arrival overshoot curve that starts fast and settles with a slight overshoot. This means all entrance animations on the flashcard idle page and the browse page feel sluggish and flat compared to the rest of the app.

## Target

Both files should import the canonical `motionEase` from `@/lib/utils/animation` instead of defining their own.

## Repo conventions to follow

- Easing constants are defined once in `src/lib/utils/animation.ts`.
- All other pages import from this barrel — see `study-browser-client.tsx:14`, `dictionary-client.tsx:15`, `learn-page-client.tsx:13`, etc.

## Steps

1. Open `src/app/[locale]/flashcards/flashcards-idle.tsx`.
2. Remove line 21: `const motionEase = [0.25, 0.1, 0.25, 1] as const;`
3. Add the import at the top:
   ```typescript
   import { motionEase } from "@/lib/utils/animation";
   ```
4. Open `src/app/[locale]/flashcards/browse/flashcard-browse-client.tsx`.
5. Remove line 62: `const motionEase = [0.25, 0.1, 0.25, 1] as const;`
6. Add the import at the top with the other animation imports.

## Boundaries

- Do NOT change any transition durations or other animation parameters — only the easing curve.
- Do NOT touch any other files.
- Do NOT remove the `iOSEase` import from `src/lib/utils/animation.ts` — it's still used elsewhere.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors. `pnpm exec oxlint` — 0 warnings.
- **Feel check**: Navigate to the flashcard idle page (`/flashcards`). The entrance animation should now feel faster and snappier (overshoot settle) instead of sluggish and linear. Same for the flashcard browse page (`/flashcards/browse`).
- **Done when**: Both files import from `@/lib/utils/animation` and the inline `motionEase = [0.25, 0.1, 0.25, 1]` is removed from both.
