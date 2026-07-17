# Plan 225: Audit next/image usage and add priority to above-the-fold images

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf

## Why this matters

Next.js `<Image>` component lazy-loads by default (`loading="lazy"`). For images visible in the initial viewport (above the fold), this introduces a delay before they start loading — the browser doesn't discover the image until the layout is painted, and then waits for the intersection observer to trigger. Adding `priority` disables lazy-loading and triggers a preload `<link>` tag in the `<head>`, improving Largest Contentful Paint (LCP) by telling the browser to fetch the image immediately.

The codebase has 8+ `<Image>` components across components like `image-viewer.tsx`, `SmartImage.tsx`, `content-block-renderer.tsx`, `diagram-input.tsx`, `diagram-labelling-input.tsx`, `hot-spot-input.tsx`, `referral-tab.tsx`, `solver-input-tools.tsx`, and `pwa-update-toast.tsx`. None currently use the `priority` prop.

## Current state

- `src/components/visual/image-viewer.tsx:35-47` — `<Image fill ...>` without `priority` — used for quiz-related images that may appear above the fold
- `src/components/chat/SmartImage.tsx:14-23` and `src/components/chat/SmartImage.tsx:28-34` — two `<Image>` usages without `priority` — chat images loaded on-demand (often below fold)
- `src/components/exam/content-block-renderer.tsx` — exam content images, no priority
- `src/components/ui/inputs/diagram-input.tsx` — user-uploaded diagram, no priority
- `src/components/quiz/parts/hot-spot-input.tsx` — question diagram, no priority
- `src/components/quiz/parts/diagram-labelling-input.tsx` — question diagram, no priority
- `src/components/quiz/parts/diagram-input.tsx` — question diagram, no priority
- `src/components/settings/tabs/referral-tab.tsx` — referral QR/share image
- `src/components/tools/communication/solver-input-tools.tsx` — solver image
- `src/components/pwa/pwa-update-toast.tsx` — app icon in PWA toast (always below fold initially)

## Target state

- `image-viewer.tsx` accepts optional `priority` prop (default `false`) — callers that use it above the fold can pass `priority`
- `SmartImage.tsx` accepts optional `priority` prop
- Components where images are always above-the-fold (question diagrams in quiz/exam) get `priority={true}`
- Components where images are always below the fold (PWA toast, chat messages) remain unchanged

## Scope

- `src/components/visual/image-viewer.tsx` — add `priority` prop
- `src/components/chat/SmartImage.tsx` — add `priority` prop
- `src/components/quiz/parts/hot-spot-input.tsx` — pass `priority` if image is above fold
- `src/components/quiz/parts/diagram-labelling-input.tsx` — pass `priority` if image is above fold
- `src/components/quiz/parts/diagram-input.tsx` — pass `priority` if image is above fold
- All other image consumers — audit and decide

## Steps

### 1. Add priority prop to ImageViewer

In `src/components/visual/image-viewer.tsx`, add `priority?: boolean` to the `ImageViewerProps` interface and pass it through to the `<Image>` component:

```tsx
interface ImageViewerProps {
  url: string;
  label: string;
  attribution?: string;
  sourceUrl?: string;
  priority?: boolean;
}
```

Then on the `<Image>` element: `priority={priority}`.

### 2. Add priority prop to SmartImage

In `src/components/chat/SmartImage.tsx`, add `priority` to `SmartImageProps` and pass to both `<Image>` usages.

### 3. Audit image usage per component

For each component, determine if the image appears above the fold on first paint:

| Component                     | Above fold?                   | Action                         |
| ----------------------------- | ----------------------------- | ------------------------------ |
| `image-viewer.tsx`            | Depends on context            | Prop-based (done in step 1)    |
| `SmartImage.tsx`              | Depends on context            | Prop-based (done in step 2)    |
| `hot-spot-input.tsx`          | Yes (question image)          | Add `priority`                 |
| `diagram-labelling-input.tsx` | Yes (question image)          | Add `priority`                 |
| `diagram-input.tsx`           | Yes (question image)          | Add `priority`                 |
| `content-block-renderer.tsx`  | Depends on content            | Prop-based (add prop)          |
| `referral-tab.tsx`            | Yes (QR code in settings tab) | Add `priority`                 |
| `solver-input-tools.tsx`      | Depends on input              | Leave as-is (below fold often) |
| `pwa-update-toast.tsx`        | No (appears after idle)       | Leave as-is                    |

### 4. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

## Stop conditions

- Images fail to load or show broken state
- Console warnings about `priority` being used with `loading="lazy"` (they're mutually exclusive — `priority` implies `loading="eager"`)

## Estimated time

30 min
