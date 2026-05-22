# ADR-04: Theming Strategy — CSS Variables, Dark Mode for Night Study, Brand Token Injection

**Status:** Accepted  
**Date:** 2026-05-23  
**Author:** Senior Frontend Architect

## Context

`src/app/globals.css` contains 589 lines of Apple-inspired design tokens (oklch colors, liquid glass materials, spacing scale). We need a maintainable strategy that supports:
- Light/dark mode (students study at night)
- Brand customization for school white-labeling
- Consistent component theming without hardcoded values

## Decision

1. **CSS custom properties** in `:root` and `.dark` are the single source of truth for all colors, spacing, and radii.
2. **No hardcoded hex, RGB, or oklch values** in component files. All values reference CSS variables.
3. **Dark mode** toggled via `document.documentElement.classList.toggle("dark")` — Tailwind v4 `@custom-variant dark` handles the rest.
4. **Brand token injection** happens at build time by overriding CSS variables in a `<style>` tag injected via `next/head` or Edge Config for school deployments.
5. **Glassmorphism** is restricted to `Card`, `Sheet`, and `Dialog` shells. Never apply glass directly over body text.

## Consequences

- **Positive:** Instant theme switching; school white-labeling without rebuild; accessible contrast maintained
- **Negative:** CSS variable proliferation requires discipline; oklch browser support needs fallback

## Related

- `src/app/globals.css`
- `src/components/theme/theme-provider.tsx`
