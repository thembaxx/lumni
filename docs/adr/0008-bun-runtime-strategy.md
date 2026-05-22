# ADR-07: Bun Runtime and Package Management Strategy

**Status:** Proposed  
**Date:** 2026-05-23  
**Author:** Senior Frontend Architect

## Context

Lumni previously used npm with `npm ci` in CI and mixed `tsx` / `bun test` in scripts. No lockfile was present, causing install inconsistency. Build times on Vercel were slow due to npm install overhead.

## Decision

1. **Bun is the exclusive package manager.** `bun.lockb` is the only lockfile.
2. **CI uses `bun install --frozen-lockfile`.** Never `npm install` or `yarn`.
3. **Scripts use `bun run`.** Native TS scripts run via `bun` instead of `tsx` where possible.
4. **Lint/Format gate:** `bunx @biomejs/biome check .` blocks merge.
5. **Type check gate:** `bun run typecheck` (tsc --noEmit) blocks merge.
6. **Build gate:** `bun run build` → Vercel deployment.
7. **Test gate:** `bun test` for unit tests.
8. **shadcn updates:** `bunx shadcn@latest add [component]` or `bunx shadcn@latest update`.

## Migration Steps

1. Delete any `package-lock.json` or `yarn.lock`.
2. Run `bun install` to generate `bun.lockb`.
3. Update `package.json` scripts to use `bun` and `bunx`.
4. Add `"engines": { "bun": ">=1.2.0" }` to `package.json`.
5. Update `.github/workflows/ci.yml` to use `oven-sh/setup-bun@v2`.

## Consequences

- **Positive:** 30–40% faster installs; single lockfile; native TS execution
- **Negative:** Some packages (e.g., `sharp`, `patch-package`) need Bun compatibility verification; Windows devs may need WSL

## Related

- `package.json`
- `.github/workflows/ci.yml`
- `biome.json`
