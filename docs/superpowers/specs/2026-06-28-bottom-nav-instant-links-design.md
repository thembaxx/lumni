# Bottom Nav Instant Link Navigation

## Goal

Replace the 4 bottom nav `<m.button>` + `onClick` items with Next.js `<Link>` components so they leverage `<Link>`'s built-in prefetching + Next.js 16's `partialPrefetching`/`cacheComponents` pipeline for instant navigation.

## Scope

One file: `src/components/navigation/bottom-nav.tsx`

Out of scope: sidebar nav, top nav, or any other navigation component.

## Design

### Imports

- Remove: `useNavigationDirection` hook, `motion/react-m` (keep for Tools button)
- Add: `Link` from `@/i18n/navigation`

### NavItemComponent

- Replace `<m.button>` with `<Link href={item.href}>`
- Drop `onNavigate` / `onClick` props
- Drop `type="button"`, `whileTap` animation
- Add `active:scale-[0.96] transition-transform` CSS classes for tap feedback
- Add `no-underline` to reset link styling
- Keep `aria-label`, `aria-current`, icon/label rendering, badge

### BottomNav

- Remove `const { push } = useNavigationDirection()`
- Remove `handleNavigate` callback
- `NavItemComponent` no longer receives `onNavigate` prop

### Tools button

- Stays as `<m.button>` (not a navigation link — opens dialog)

## Verification

- `pnpm run typecheck` — 0 errors
- `pnpm exec biome check` — 0 errors on changed file
- `pnpm run test` — no regressions
