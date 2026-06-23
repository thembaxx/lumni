# ADR-07: Package Management Strategy

**Status:** Superseded by ADR-0013  
**Date:** 2026-05-23 (updated 2026-06-22)  
**Author:** Senior Frontend Architect

## Context

Lumni previously used npm with `npm ci` in CI. A Bun migration was attempted (documented here) but never completed. The project now uses pnpm as its sole package manager.

## Decision (original, now superseded)

1. **Bun is the exclusive package manager.** `bun.lockb` is the only lockfile.
2. **CI uses `bun install --frozen-lockfile`.** Never `npm install` or `yarn`.
3. **Scripts use `bun run`.** Native TS scripts run via `bun` instead of `tsx` where possible.
4. **Lint/Format gate:** `bunx @biomejs/biome check .` blocks merge.
5. **Type check gate:** `bun run typecheck` (tsc --noEmit) blocks merge.
6. **Build gate:** `bun run build` → Vercel deployment.
7. **Test gate:** `bun test` for unit tests.
8. **shadcn updates:** `bunx shadcn@latest add [component]` or `bunx shadcn@latest update`.

## Actual Current State (as of June 2026)

The Bun migration documented here was never completed. The project uses **pnpm** as its package manager:

- Lockfile: `pnpm-lock.yaml`
- Config: `pnpm-workspace.yaml`
- CI: `pnpm install --frozen-lockfile`
- Scripts: `pnpm run <script>`, `pnpm exec <bin>`
- Declared in `package.json` via `"packageManager": "pnpm@10.8.1"`

See ADR-0013 for the current strategy.

## Consequences (historical)

- **Positive:** 30–40% faster installs; single lockfile; native TS execution
- **Negative:** Some packages (e.g., `sharp`, `patch-package`) need Bun compatibility verification; Windows devs may need WSL

## Related

- `package.json`
- `.github/workflows/ci.yml`
- `biome.json`
- ADR-0013 (current strategy)
