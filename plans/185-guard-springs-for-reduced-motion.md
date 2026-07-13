# 185 — Guard spring animations for reduced motion

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 9 files, ~14 transition objects

## Problem

14 spring/spring-like animations across 9 celebration and interaction files have **no `useReducedMotion()` check**. These will bounce at full intensity for users who prefer reduced motion.

AUDIT.md §6: "Reduced motion means fewer and gentler animations, not zero — keep transitions that aid comprehension, remove position changes."

Affected files:

| File                                                | Lines    | Issue                                                             |
| --------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `src/components/celebration/achievement-unlock.tsx` | 41       | `type: "spring", bounce: 0.25` — icon entrance with 180° rotation |
| `src/components/celebration/achievement-unlock.tsx` | 52       | `type: "spring"` — text block entrance                            |
| `src/components/celebration/streak-fire.tsx`        | 35       | `type: "spring", bounce: 0` — sparkle badge                       |
| `src/components/celebration/streak-fire.tsx`        | 62       | `type: "spring"` — streak number scale                            |
| `src/components/celebration/level-up.tsx`           | 29       | `duration: 2` — 2s pulsing glow                                   |
| `src/components/celebration/level-up.tsx`           | 36       | `delay: 0.2` — crown entrance                                     |
| `src/components/celebration/level-up.tsx`           | 39       | `duration: 0.6` — crown rotation wobble                           |
| `src/components/celebration/level-up.tsx`           | 54       | `type: "spring", bounce: 0` — level number scale                  |
| `src/components/auth/success-badge.tsx`             | 32       | `type: "spring"` — sparkle icon entrance                          |
| `src/components/auth/success-badge.tsx`             | 55       | `type: "spring"` — badge entrance                                 |
| `src/components/admin/admin-dashboard.tsx`          | 152      | `type: "spring"` — success toast checkmark                        |
| `src/components/ui/voice-recorder/send-button.tsx`  | 54,66,78 | 3x `type: "spring", duration: 0.4` — text swap                    |
| `src/components/navigation/top-nav.tsx`             | 91       | `type: "spring"` — XP progress bar fill                           |
| `src/components/navigation/bottom-nav.tsx`          | 96       | `type: "spring"` — tab `whileTap` scale                           |

## Target

For each file, add `useReducedMotion()` and branch the spring config:

**Before**:

```typescript
transition={{ type: "spring", stiffness: 400, damping: 28 }}
```

**After**:

```typescript
transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 28 }}
```

For celebration components, the reduced-motion fallback should use `{ duration: 0 }` (not `undefined`) since these are decorative — they should still complete their entrance/state change instantly rather than being skipped entirely.

## Repo conventions to follow

- `useReducedMotion()` from `"motion/react"` is the standard hook — used in 100+ files already.
- The `transition={prefersReducedMotion ? { duration: 0 } : springConfig}` pattern is used in `quiz-view.tsx:90`, `dashboard-content.tsx:69`, and `QuestionCardFeedback.tsx`.
- For `bottom-nav.tsx`, the file already imports `useReducedMotion()` and has `shouldAnimate` logic — the spring transition objects just need the same treatment.

## Steps

1. **achievement-unlock.tsx**: Add `useReducedMotion()` import, branch the spring config for icon rotation (line 41) and text entrance (line 52).
2. **streak-fire.tsx**: Add `useReducedMotion()` import, branch sparkle (line 35) and streak number (line 62) spring configs.
3. **level-up.tsx**: Add `useReducedMotion()` import, branch all 4 animation transitions (lines 29, 36, 39, 54).
4. **success-badge.tsx**: Add `useReducedMotion()` import, branch sparkle (line 32) and badge (line 55) transitions.
5. **admin-dashboard.tsx**: Add `useReducedMotion()` import, branch the success toast transition (line 152).
6. **send-button.tsx**: Add `useReducedMotion()` import, branch all 3 AnimatePresence transitions (lines 54, 66, 78).
7. **top-nav.tsx**: The XP progress bar spring (line 91) — add reduced-motion guard.
8. **bottom-nav.tsx**: Check if `whileTap` transitions are already guarded by `shouldAnimate` — the spring object on line 96 is passed inside the Motion component which already checks `shouldAnimate` for the `whileTap`/`whileHover` props, so it may already be handled.

## Boundaries

- Do NOT change spring stiffness/damping values — only add the reduced-motion guard.
- Do NOT remove animation entirely — decorative elements should still show the result, just without the spring bounce.
- Do NOT touch the CelebrationProvider or gamification engine files.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Feel check**: Enable `prefers-reduced-motion: reduce` in DevTools. Trigger an achievement unlock or level up — the icon/badge should appear instantly with NO spring bounce or rotation animation. The content should be fully visible in its final state.
- **Done when**: All 14 spring transition configs across 9 files are guarded by `prefersReducedMotion`.
