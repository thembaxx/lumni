# Full-Screen Quiz Mode — Design Spec

**Date:** 2026-05-28
**Status:** Draft

## Overview

Add an immersive full-screen mode for quiz and exam sessions. Nav bars (TopNav, BottomNav, DesktopSidebar) auto-hide when a session starts, with a manual toggle to restore them. Touch targets are enlarged for mobile comfort. The quiz layout reclaims viewport real estate.

## Architecture

### ImmersiveMode Context
- **Path:** `src/components/shared/immersive-mode.tsx`
- Provides `{ isImmersive: boolean, setImmersive: (v: boolean) => void, toggleImmersive: () => void }` via React context
- `ImmersiveModeProvider` wraps app in `layout.tsx`
- Quiz/exam pages call `setImmersive(true)` on mount, `false` on unmount (via `useEffect` cleanup)

### Nav Hiding
- `TopNav`: reads `isImmersive` — returns `null` when true
- `BottomNav`: reads `isImmersive` — returns `null` when true
- `DesktopSidebar`: reads `isImmersive` — returns `null` when true
- Smooth fade-out transition: `opacity` + `y` offset, 200ms, `iOSDecelerate` ease

### Exit Button
- Floating pill button at top-right of viewport
- Text: "Exit full-screen" (icon + label)
- Only visible when `isImmersive` is true
- Calls `setImmersive(false)` on click
- Fades out when navs return

### Layout Changes

| Component | Change |
|---|---|
| `quiz-view.tsx` | Remove `pb-20`. Remove decorative right panel (`md:col-span-5`). Content takes full width. |
| `QuestionCardInput.tsx` | MCQ options: add `min-h-[48px]` for larger touch targets. Bump font weight for readability. |
| `quiz-view.tsx` | Add `useEffect(() => { setImmersive(true); return () => setImmersive(false); }, [])` |
| `exam-session-client.tsx` | Same `useEffect` pattern |

### Edge Cases

| Case | Handling |
|---|---|
| Navigate away | `useEffect` cleanup calls `setImmersive(false)` |
| Manual toggle | Navs re-appear, quiz continues in normal mode |
| Reduced motion | Skip fade animation, instant show/hide |
| Mobile orientation | Context persists, layout reflows naturally |

## Files Changed

- `src/components/shared/immersive-mode.tsx` — new
- `src/app/[locale]/layout.tsx` — add `<ImmersiveModeProvider>`
- `src/components/navigation/top-nav.tsx` — add `isImmersive` check
- `src/components/navigation/bottom-nav.tsx` — add `isImmersive` check
- `src/components/navigation/desktop-sidebar.tsx` — add `isImmersive` check
- `src/components/quiz/quiz-view.tsx` — set immersive + remove decorative panel + remove `pb-20`
- `src/components/quiz/parts/QuestionCardInput.tsx` — larger touch targets
- `src/app/[locale]/exam/[id]/exam-session-client.tsx` — set immersive
