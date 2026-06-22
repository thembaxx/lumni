# Lottie Expansion: Dashboard Stats, Micro-Interactions, Quiz Polish, Performance & Visual Engine

## 1. Dashboard Stats Lottie

**Goal:** Replace static Tabler SVG icons in the 3 dashboard stat cards with playable Lottie animations.

### Changes

- `StatCard` in `stats-cards.tsx` gains an optional `animation?: LottieAnimationName` prop.
- When `animation` is provided and `useLottie` is true, render `<LottieWrapper>` instead of the Tabler `Icon`.
- The icon is kept as fallback (when Lottie is disabled / `prefers-reduced-motion`).
- Static icon circle container stays — Lottie renders inside it.

### Animation Mapping

| Stat Card | Current Icon     | Lottie Animation              |
| --------- | ---------------- | ----------------------------- |
| Streak    | `IconFlame`      | `streak-fire`                 |
| Questions | `IconTarget`     | `loading-dots` (subtle pulse) |
| Accuracy  | `IconTrendingUp` | `success-check` (gentle loop) |

### Files Touched

- `src/components/dashboard/stats-cards.tsx`

---

## 2. Quiz Feedback Polish

**Goal:** Replace Japanese-text Lottie animations (`quiz-correct` shows 正解, `quiz-incorrect` shows 不正解) with English-friendly alternatives.

### Approach

1. Search LottieFiles for a green checkmark burst animation (no text) for correct answers.
2. Search for a red X shake animation (no text) for incorrect answers.
3. Download, extract, and register as `quiz-correct-v2` and `quiz-incorrect-v2` in the asset registry.
4. Update `question-card.tsx` to reference the new animations.
5. Keep old Japanese animations in the registry (not breaking existing references).

### Fallback

If suitable animations cannot be sourced, use `success-check` and `error-state` with a color override — these are already registered and text-free.

### Files Touched

- `src/assets/animations/` (2 new JSON files)
- `src/components/lottie/lottie-assets.ts`
- `src/components/quiz/question-card.tsx`

---

## 3. Micro-Interactions

**Goal:** Wire `useLottiePlayer` (currently exported but unused) into interactive touchpoints for subtle Lottie feedback.

### Touchpoints

1. **Question-card submit button** — on submit, play a brief `success-check` pulse (200ms duration).
2. **Tab navigation** (dashboard tabs) — play `loading-dots` (1 bounce) on tab switch.
3. **Card hover** — on hover, play a single frame advance of `streak-fire` or `xp-burst`.

### Implementation Detail

- Create a small `useInteractionLottie` hook (or use `useLottiePlayer` directly) that mounts a hidden Lottie instance and triggers one-shot playback.
- Add a `LottieSparkle` component: a tiny absolutely-positioned Lottie that plays once on trigger and auto-dismounts.
- Keep interactions subtle: 1x play, no loop, small footprint (16x16 to 24x24).

### Files Touched

- `src/components/lottie/lottie-sparkle.tsx` (new)
- `src/components/quiz/question-card.tsx`
- `src/components/dashboard/navigation/tab-nav.tsx`

---

## 4. Performance: Lazy-Load Animation JSONs

**Goal:** Avoid bundling all 14 animation JSONs in the main chunk — lazy-load on demand.

### Current Problem

`lottie-assets.ts` statically imports all JSON files:

```ts
import confettiData from "@/assets/animations/confetti.json";
// ... 13 more
```

Each import is a static `import ... from` that Webpack/Next.js bundles eagerly.

### Approach

Replace the static object with a lazy map:

```ts
export const LOTTIE_ANIMATIONS: Record<LottieAnimationName, () => Promise<object>> = {
  confetti: () => import("@/assets/animations/confetti.json"),
  // ...
};
```

Update `LottieWrapper` to:

1. Accept the async resolver.
2. Use `useEffect` + `useState` to load on mount.
3. Show the existing `loading` placeholder while resolving.

This moves all JSON files to separate chunks loaded only when their animation is first requested.

### Trade-off

- **Pro:** Smaller initial bundle (saves ~400KB+).
- **Con:** Brief flash while animation data loads on first render.
- **Mitigation:** The `@lottiefiles/dotlottie-react` dynamic import already shows a placeholder div — the JSON load happens concurrently.

### Files Touched

- `src/components/lottie/lottie-assets.ts`
- `src/components/lottie/lottie-wrapper.tsx`

---

## 5. Visual Engine + Lottie

**Goal:** Add animated loading state to `VisualContent` while diagrams are being generated.

### Approach

- In `visual-content.tsx`, when `isLoading` is true, render a centered `<LottieWrapper animation="loading-lumni" />` instead of the current spinner/Skeleton.
- This is a cosmetic upgrade — no architectural change to the Visual Engine.
- Future enhancement: add a `"lottie-animation"` VisualContentType and a `lottieRef` export on `VisualContent` for programmatic play/pause, allowing the AI to generate Lottie animation references for diagrams.

### Files Touched

- `src/components/visual/visual-content.tsx`

---

## Dark Mode (already done)

No changes needed. Custom `ThemeProvider`, CSS variable system with `.dark` overrides, flash prevention script, and `ThemeSwitcher` all exist and work.

---

## Dependencies

Lottie animations use `@lottiefiles/dotlottie-react` (canvas-based). No `lottie-web` dependency or version pins are needed — the dotLottie player uses a self-contained WASM renderer that ships with the package.

---

## File Change Summary

| File                                              | Action                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `src/components/dashboard/stats-cards.tsx`        | Modify — add optional `animation` prop to `StatCard`               |
| `src/assets/animations/quiz-correct-v2.json`      | Add (if new animation sourced)                                     |
| `src/assets/animations/quiz-incorrect-v2.json`    | Add (if new animation sourced)                                     |
| `src/components/lottie/lottie-assets.ts`          | Modify — convert to lazy imports, register new animations          |
| `src/components/lottie/lottie-wrapper.tsx`        | Modify — async resolution of animation data                        |
| `src/components/lottie/lottie-sparkle.tsx`        | Add — one-shot micro-interaction component                         |
| `src/components/quiz/question-card.tsx`           | Modify — update animation references, add submit micro-interaction |
| `src/components/dashboard/navigation/tab-nav.tsx` | Modify — add tab-switch micro-interaction                          |
| `src/components/visual/visual-content.tsx`        | Modify — Lottie loading state                                      |

No breaking changes. All existing consumers continue to work.
