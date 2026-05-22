# ADR-02: shadcn/ui Adoption and Custom Primitive Extension Policy

**Status:** Accepted  
**Date:** 2026-05-23  
**Author:** Senior Frontend Architect

## Context

Lumni has 42 shadcn/ui primitives in `src/components/ui/`. Some custom components (e.g., `live-waveform.tsx`, `voice-recorder.tsx`) bypass Radix primitives entirely. Others extend Radix correctly. We need a consistent policy to ensure upgrades are safe and accessibility defaults are preserved.

## Decision

1. All **interactive** components (buttons, dialogs, selects, tabs) must use Radix primitives — either via `bunx shadcn@latest add [component]` or manual Radix composition.
2. All **non-interactive** custom components (waveform, equation renderer) are exempt from Radix but must implement their own a11y fallback (ARIA labels, focus management).
3. shadcn primitives in `src/components/ui/` remain **untouched** by domain logic. They are updated exclusively via CLI.
4. Domain-specific compositions live in `src/components/molecules/` and `src/components/organisms/`.

## Consequences

- **Positive:** `bunx shadcn@latest update` is safe; a11y defaults from Radix are inherited; consistent DX
- **Negative:** Custom interactive components need more upfront a11y work; cannot use "quick hacks"

## Related

- `biome.json` a11y rules enforce `useValidAriaProps`, `useAltText`
- `src/components/ui/button.tsx` uses `@base-ui/react/button` + Radix Slot
