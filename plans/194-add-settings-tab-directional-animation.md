# 194 — Add directional slide to settings tab content

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: LOW
- **Category**: Missed opportunity
- **Estimated scope**: 1 file, ~10 lines

## Problem

Settings tab panels in `src/components/settings/tabs/` appear/disappear with **no directional slide animation**. When the user switches tabs (e.g., from Profile to Appearance), the content teleports — one panel instantly replaces another with no spatial relationship communicated.

AUDIT.md §8: "Spatially-connected UI (a panel that appears from a trigger) with no motion explaining where it came from."

## Target

Add `AnimatePresence mode="wait"` with directional slide animations. The new panel should slide in from the right (next tab) or left (previous tab) based on the direction of the tab switch. Exit animation slides the old panel out in the opposite direction.

## Repo conventions to follow

- `AnimatePresence mode="wait"` with `springPresets.fast` is the standard pattern — used in `send-button.tsx:46`, `onboarding-client.tsx:165`.
- Directional slide: `initial={{ x: 20, opacity: 0 }}`, `animate={{ x: 0, opacity: 1 }}`, `exit={{ x: -20, opacity: 0 }}` for forward, reversed for backward.

## Steps

1. Open the settings client component that renders tab panels (`src/components/settings/tabs/` or `src/app/[locale]/settings/settings-client.tsx`).

2. Wrap the tab content container in `<AnimatePresence mode="wait">` (if not already wrapped).

3. Track the current tab index to determine animation direction. When switching to a higher index, slide left/forward. When switching to a lower index, slide right/back.

4. Add the `m.div` wrapper with `key={tabId}` and directional animation:
   ```tsx
   <AnimatePresence mode="wait" initial={false}>
     <m.div
       key={activeTab}
       initial={{ x: isForward ? 20 : -20, opacity: 0 }}
       animate={{ x: 0, opacity: 1 }}
       exit={{ x: isForward ? -20 : 20, opacity: 0 }}
       transition={springPresets.fast}
     >
       {tabContent}
     </m.div>
   </AnimatePresence>
   ```

## Boundaries

- Do NOT change the tab navigation UI (indicators, labels, layout).
- Do NOT change any settings form logic or state management.
- Do NOT add new dependencies.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Feel check**: Open the Settings page. Switch between tabs. The new panel should slide in from the right (moving forward) and the old panel should slide out to the left. Switching back should reverse the direction.
- **Done when**: Settings tab content transitions with a directional slide animation instead of teleporting.
