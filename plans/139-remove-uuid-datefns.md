# Plan 139: Remove uuid + date-fns unused dependencies

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step.
>
> **Drift check (run first)**: `git diff --stat 6c00cdcd..HEAD -- package.json src/lib/api/create-route-handler.ts src/components/study-groups/post-card.tsx`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: deps
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

`uuid@14.0.1` is used only in `create-route-handler.ts` and `date-fns@4.4.0` only in `post-card.tsx`. Both add unnecessary bundle weight (~4KB and ~tree-shakable but still retained). `nanoid` (already in the bundle) or `crypto.randomUUID()` can replace uuid. `Intl.RelativeTimeFormat` is built-in and supported in all target browsers (ES2022 target).

## Current state

- `package.json` lists both `uuid@14.0.1` and `nanoid@5.1.16`
- `uuid` usage: `src/lib/api/create-route-handler.ts` — `crypto.randomUUID()` call
- `date-fns` usage: `src/components/study-groups/post-card.tsx` — `formatDistanceToNow()`

## Steps

### Step 1: Replace uuid with crypto.randomUUID()

In `create-route-handler.ts`, replace `import { v4 as uuidv4 } from "uuid"` with the built-in `crypto.randomUUID()`. They produce the same UUID v4 format.

**Verify**: `pnpm run typecheck` → 0 errors

### Step 2: Replace date-fns with Intl.RelativeTimeFormat

In `post-card.tsx`, replace:

```ts
import { formatDistanceToNow } from "date-fns";
// ...
formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
```

with:

```ts
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const diff = Math.floor((Date.now() - new Date(post.createdAt).getTime()) / 86400000);
if (diff === 0) return "today";
if (diff === 1) return "yesterday";
return rtf.format(-diff, "day");
```

Or use a simpler inline helper. Match the existing component's locale handling if i18n is in use (check if `post-card.tsx` uses `next-intl`).

**Verify**: `pnpm run test` → all pass

### Step 3: Remove dependencies

```bash
pnpm remove uuid date-fns
```

**Verify**: `pnpm run typecheck` + `pnpm run test` → both pass

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `uuid` not in `package.json` dependencies
- [ ] `date-fns` not in `package.json` dependencies
- [ ] No remaining imports from `uuid` or `date-fns`
