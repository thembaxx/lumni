# 179 — Define missing `--ease-ios` CSS tokens

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: HIGH
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file, ~5 lines

## Problem

`--ease-ios` and `--ease-ios-decelerate` CSS variables are referenced in 15+ files via Tailwind v4's `ease-(--ease-ios)` syntax and `transitionTimingFunction: "var(--ease-ios-decelerate)"` but are **never defined** in `globals.css` or any CSS file.

Since the CSS `var()` has no fallback, these silently resolve to the browser default `ease` (which is `ease-in-out`), the wrong curve for all these entrance/transition use cases.

Affected files (sample):

- `src/components/dashboard/countdown-header.tsx:196` — `transition-[opacity,transform] duration-200 ease-(--ease-ios)`
- `src/components/dashboard/section-reveal.tsx:19` — `transition-[opacity,transform] duration-400 ease-(--ease-ios)`
- `src/components/dashboard/competency-overview.tsx:233` — `transition-[grid-template-rows,opacity] duration-300 ease-(--ease-ios)`
- `src/components/dashboard/parts/storage-ring.tsx:52` — `transition-[stroke-dashoffset] duration-500 ease-(--ease-ios)`
- `src/components/shared/animated-progress-bar.tsx:45` — `transition-[width] duration-800 ease-(--ease-ios)`
- `src/components/listen-to-lesson.tsx:114` — `transition-colors duration-150 ease-(--ease-ios)`
- `src/components/onboarding/subject-selection-step.tsx:117` — `transition-[grid-template-rows,opacity] duration-200 ease-(--ease-ios-decelerate)`
- `src/components/stories/comprehension-feedback.tsx:25` — `transition-[grid-template-rows,opacity] duration-300 ease-(--ease-ios-decelerate)`
- `src/components/tools/math/calculator-history.tsx:12` — `ease-(--ease-ios-decelerate)`
- `src/app/[locale]/exam/[id]/pdf/pdfslick-viewer-section.tsx:35` — `ease-(--ease-ios-decelerate)`
- `src/app/[locale]/exam/[id]/pdf/pdf-page-client.tsx:97` — `ease-(--ease-ios-decelerate)`
- `src/components/ui/voice-recorder/control-buttons.tsx:82,91,118,127` — `transitionTimingFunction: "var(--ease-ios-decelerate)"`

## Target

Two new CSS custom properties in `src/app/globals.css` within the `:root` block, alongside the existing `--ease-*` tokens:

```css
--ease-ios: cubic-bezier(
  0.16,
  1,
  0.3,
  1
); /* iOS-style ease-out — matches iOSEase in animation.ts */
--ease-ios-decelerate: cubic-bezier(
  0,
  0,
  0.2,
  1
); /* iOS deceleration curve — matches iOSDecelerate in animation.ts */
```

These should be placed right after `--ease-drawer` (line 140).

## Repo conventions to follow

- Easing tokens live in `src/app/globals.css` in the `:root` block (lines 130-143).
- Existing tokens use `--ease-` prefix with descriptive names.
- The values match the JS constants already defined in `src/lib/utils/animation.ts:7-8` (`iOSEase` and `iOSDecelerate`).

## Steps

1. Open `src/app/globals.css`.
2. Locate the `:root` block's motion section (lines 130-143).
3. Add the two new variables after `--ease-drawer` (line 140) and before `--motion-fast` (line 141):

```css
--ease-ios: cubic-bezier(0.16, 1, 0.3, 1);
--ease-ios-decelerate: cubic-bezier(0, 0, 0.2, 1);
```

## Boundaries

- Do NOT touch any TSX/TS files — only the CSS variable definition is missing.
- Do NOT change the values of any existing easing tokens.
- Do NOT remove the deprecated `ease-ios` / `ease-ios-decelerate` from Tailwind utility classes — those are separate findings.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors. `pnpm exec oxlint` — 0 warnings.
- **Feel check**: Open the app in a browser. Trigger a dashboard transition (collapsing countdown header, section reveal, competency expand) — the easing should now feel snappier (starts fast, decelerates) instead of the sluggish symmetric ease-in-out.
- **Done when**: All `ease-(--ease-ios)` and `var(--ease-ios-decelerate)` references resolve to the correct cubic-bezier curves. Verify in DevTools Computed panel that `transition-timing-function` shows the correct bezier.
