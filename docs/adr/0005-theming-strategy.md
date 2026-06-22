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

## Enforcement Rules (Added 2026-05-23)

The following rules were established after a codebase-wide audit and are now enforced:

### Shadows

- **No hardcoded shadow values** in components (e.g., `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`).
- Always use design tokens: `shadow-level-1`, `shadow-level-2`, `shadow-level-3`.
- These tokens are mapped in `@theme inline` in `globals.css` so Tailwind v4 generates them as utilities.
- They are automatically dark-mode aware (`.dark` overrides with elevated opacity oklch values).

### Border Radius

- **No arbitrary radius values** (e.g., `rounded-[2.5rem]`).
- Standard tokens: `rounded-sm` (8px), `rounded-md` (12px), `rounded-lg` (20px), `rounded-xl` (24px), `rounded-2xl` (28px), `rounded-3xl` (32px), `rounded-card-lg` (40px).
- `rounded-card-lg` is mapped in `@theme inline` as `--radius-4xl: var(--radius-card-lg)`.

### Z-Index

- **No magic numbers** (e.g., `z-50`, `z-[100]`).
- Semantic scale defined in `globals.css`:
  - `--z-content` (0) — default content
  - `--z-elevated` (10) — hover states, floating labels
  - `--z-sticky` (20) — sticky headers
  - `--z-header` (30) — top navigation
  - `--z-drawer` (40) — side drawers, bottom sheets
  - `--z-modal` (50) — dialogs, overlays
  - `--z-toast` (60) — notifications
  - `--z-skip-link` (100) — accessibility
- All mapped in `@theme inline` for Tailwind v4 utility generation.

### Spacing

- **No arbitrary pixel values** (e.g., `w-[200px]`, `min-h-[250px]`, `text-[13px]`).
- Use the 8pt spacing scale (`--space-1` through `--space-16`) and typography scale (`--fs-caption-2` through `--fs-large-title`).
- Map spacing values in `@theme inline` so Tailwind utilities align with the design system.

### Vertical Rhythm

- Use `gap-*` (flexbox/grid `gap`) for all spacing between siblings.
- Do **not** use `space-y-*` or manual `mt-*` / `mb-*` pairs.
- Wrap block containers in `flex flex-col` when needed to enable `gap`.

### Page Layout

- Every page (except home feed and admin dashboards) must use `<PageContainer>`.
- `PageContainer` defines `max-w-3xl px-4 sm:px-6 lg:max-w-4xl xl:max-w-6xl`.
- No page should declare its own `max-w-*` or `px-*`.

## Consequences

- **Positive:** Instant theme switching; school white-labeling without rebuild; accessible contrast maintained
- **Negative:** CSS variable proliferation requires discipline; oklch browser support needs fallback

## Related

- `src/app/globals.css`
- `src/components/theme/theme-provider.tsx`
