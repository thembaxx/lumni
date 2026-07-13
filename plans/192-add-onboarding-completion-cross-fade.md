# 192 — Add AnimatePresence cross-fade to onboarding completion

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: LOW
- **Category**: Missed opportunity
- **Estimated scope**: 1 file, ~5 lines

## Problem

When onboarding completes, the entire form component tree unmounts and a celebration div mounts with **no `AnimatePresence` transition**. The content teleports — one moment the user sees a form, the next they see a celebration view with no spatial connection.

In `src/components/onboarding/onboarding-client.tsx`:

- Lines 121-148: Completion view (`isComplete` → renders celebration div with simple fade-in)
- Lines 150-290: Form content (unmounts when `isComplete` is true)

The completion view already has a fade-in animation (line 126-128: `initial={{ opacity: 0, scale: 0.8 }}`) but the form's abrupt disappearance creates a jarring visual jump.

## Target

Wrap the form content in `<AnimatePresence mode="wait">` and add an exit animation. When the user completes onboarding, the form slides down/fades out while the celebration fades in. This creates spatial continuity — the completion feels like a transformation of the last step, not a page navigation.

The `AnimatePresence` is already imported and `initial={false}` is set at line 165 — the exit animation just needs to be added to the form content.

## Repo conventions to follow

- `AnimatePresence mode="wait"` is already used in the codebase (e.g., `onboarding-client.tsx:165`, `getting-started-card.tsx:181`, `send-button.tsx:46`).
- Exit animations use `exit={{ opacity: 0, y: -20 }}` with `springPresets.fast`.

## Steps

1. Open `src/components/onboarding/onboarding-client.tsx`.
2. Locate the form content wrapper (the conditional rendering block around line 150 that renders when `!isComplete`).
3. Add exit animation to the form content container:
   ```typescript
   <m.div
     key="onboarding-form"
     exit={{ opacity: 0, y: -20, scale: 0.95 }}
     transition={springPresets.fast}
   >
     {/* existing form content */}
   </m.div>
   ```
4. Ensure the `key` prop is set on the form container and celebration container so `AnimatePresence` can detect the swap:
   - Form container: `key="onboarding-form"`
   - Celebration container (line 121): `key="onboarding-complete"` (it already has `key` check)

5. The `mode="wait"` on the parent `AnimatePresence` (line 165) will handle the sequencing — form exits first, celebration enters after.

## Boundaries

- Do NOT change the form logic, step progression, or completion behavior.
- Do NOT add new dependencies.
- Do NOT touch the onboarding step indicators or nav buttons.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Feel check**: Go through onboarding until completion. The form should smoothly exit (fade+slide up) as the celebration view enters. The two states should not overlap visibly.
- **Done when**: The form content has an `exit` animation and both containers have distinct `key` values for `AnimatePresence` to detect the swap.
