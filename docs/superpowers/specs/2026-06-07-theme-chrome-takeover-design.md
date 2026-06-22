# App Theme Chrome Takeover

**Date:** 2026-06-07
**Status:** Design (pre-implementation)

## Problem

The Lumni theme ("The Emerald Study Room") controls the app's page content via CSS variables but does not extend into either the browser's own UI or the app's own navigation shell. Three specific gaps:

1. **Nav bars are neutral** — TopNav, BottomNav, and SidebarNav use `bg-system-background/80 backdrop-blur-xl` (neutral frosted glass). They adapt to light/dark mode but carry no brand identity.
2. **`theme-color` is static** — The browser chrome's accent color (tab strip, URL bar) is set once at SSR from hardcoded hex values. When the user toggles themes in-app, the browser chrome does not update.
3. **No PWA titlebar theming** — Installed PWAs on desktop show a native OS titlebar above the app that cannot be themed.

## Design

Three independent changes, each solving one gap.

### 1. Accent-tinted nav glass

**Files:** `src/components/navigation/top-nav.tsx`, `bottom-nav.tsx`, `sidebar-nav.tsx`

Add `bg-(--system-accent-alpha-10)` alongside the existing `bg-system-background/80 backdrop-blur-xl` on the outer container of each nav bar. The `--system-accent-alpha-10` token is already defined in `globals.css` for both light mode (`oklch(52% 0.18 146 / 0.1)`) and dark mode (`oklch(65% 0.18 146 / 0.1)`). The tint is layered below the frosted glass so the backdrop-filter still dominates.

The stack uses a `::before` pseudo-element so the accent tint layers above the frosted glass without competing for `background-color`:

1. Existing `bg-system-background/80 backdrop-blur-xl` — frosted glass (neutral base)
2. `relative before:absolute before:inset-0 before:bg-(--system-accent-alpha-10) before:pointer-events-none` — Emerald tint overlay via pseudo-element

The `::before` covers the full area at 10% accent opacity, subtly shifting the glass from neutral to Emerald-tinted. The `pointer-events-none` ensures click targets pass through.

**3 files, one variant chain each:**

- `top-nav.tsx` `<header>`: add `relative before:absolute before:inset-0 before:bg-(--system-accent-alpha-10) before:pointer-events-none`
- `bottom-nav.tsx` outer `<nav>` or inner `<div>`: same chain
- `sidebar-nav.tsx` `<aside>`: same chain

The pseudo-element approach avoids `background-color` stacking conflicts and keeps the tint visually on top of the frosted glass.

### 2. Dynamic `theme-color`

**File:** `src/components/theme/theme-provider.tsx`

The ThemeProvider already runs a `useEffect` (lines 47-59) whenever the user changes themes — it sets `classList`, `colorScheme`, and persists to localStorage. Append a step that reads the resolved `--system-background` and writes it to the `theme-color` meta tag:

```
at end of theme-change useEffect:
  meta = querySelector('meta[name="theme-color"]')
    OR createElement('meta') + append to head
  meta.content = getComputedStyle(root).getPropertyValue('--system-background')
```

The SSR `viewport.themeColor` in `src/app/layout.tsx` stays as the initial-paint guard (renders the meta tag before React hydrates). The `useEffect` takes over on interaction.

**Edge case — OKLCH in meta tags:** `getComputedStyle` resolves `--system-background` to its OKLCH value (e.g., `oklch(100% 0 0)` for light, `oklch(10% 0.01 264)` for dark). The `theme-color` meta tag accepts CSS `<color>` including OKLCH on modern browsers. If browser support gaps appear, fall back to explicit hex mapping: `resolvedTheme === "light" → "#fcfaf5"` / `"dark" → "#14141f"`.

### 3. `window-controls-overlay` (PWA titlebar)

**Files:** `public/manifest.json`, `src/app/globals.css`

Three sub-changes:

#### 3a. Manifest

Add `display_override` to `public/manifest.json`:

```json
"display_override": ["window-controls-overlay", "minimal-ui", "standalone"]
```

This tells Chromium-based browsers on desktop: prefer rendering behind the window controls. If not supported, fall back to `minimal-ui` then `standalone`.

#### 3b. CSS environment variables

Add to `src/app/globals.css`:

```css
/* PWA titlebar drag region — only applies when window-controls-overlay is active */
@media (display-mode: standalone) {
  .titlebar-drag-region {
    position: fixed;
    top: 0;
    left: env(titlebar-area-x, 0px);
    width: env(titlebar-area-width, 100%);
    height: env(titlebar-area-height, 0px);
    -webkit-app-region: drag;
    z-index: var(--z-modal);
    background: var(--system-background);
  }
}
```

#### 3c. TopNav `top` adjustment

The TopNav uses `sticky top-0` to stick to the top of the viewport. When the titlebar overlay is active, the TopNav must sit below it. Change to:

```tsx
The top offset is applied via inline style (not a Tailwind class) to avoid CSS parser issues with `env()` variable syntax.

**Detection:** CSS `env()` fallback handles it. No JS needed.

## Files Changed

| File | Change | Complexity |
|------|--------|------------|
| `src/components/navigation/top-nav.tsx` | Add accent-tint pseudo-element chain + inline `top` style | 2 lines |
| `src/components/navigation/bottom-nav.tsx` | Add accent-tint pseudo-element chain | 1 line |
| `src/components/navigation/sidebar-nav.tsx` | Add accent-tint pseudo-element chain (desktop + sheet) | 2 lines |
| `src/components/theme/theme-provider.tsx` | Dynamic `theme-color` on theme switch | ~8 lines |
| `public/manifest.json` | Add `display_override` array | 1 line |
| `src/app/globals.css` | PWA titlebar CSS | ~15 lines |

## Edge Cases

- **Theme switch during system preference change** (`prefers-color-scheme` media query change while `theme === "system"`): The existing `useEffect` (lines 61-73) handles this — it calls `getSystemTheme()` and applies the class. The `theme-color` update is already in the `useEffect` from item 2, so it fires on the handler path too.
- **FOUC**: The inline FOUC prevention script in `layout.tsx` runs before hydration. It sets `colorScheme` and the `dark` class. The `theme-color` meta tag is already present from SSR. After hydration, the `useEffect` takes over. No flash.
- **No PWA install**: `env(titlebar-area-*)` evaluates to `0px` or `unsupported`, so the titlebar region has zero height and no layout impact.
- **macOS Safari**: Does not support `window-controls-overlay`. The display_override falls through to `standalone` which already works. No titlebar region, no change in behavior.

## Verification

- `npx tsc --noEmit`: 0 errors
- Toggle themes via ThemeSwitcher, confirm browser chrome updates immediately
- Install PWA on Windows/Linux desktop Chrome, confirm titlebar area shows themed background
- Install PWA on macOS Safari, confirm no regression (titlebar stays native)
- Verify all three nav bars show subtle Emerald tint in both light and dark modes
```
