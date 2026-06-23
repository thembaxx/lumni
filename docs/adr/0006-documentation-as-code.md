# ADR-05: Documentation-as-Code Workflow — Storybook, MDX Sync, Biome.js Enforcement

**Status:** Rejected — tooling diverged (oxlint/oxfmt, pnpm); stories centralized not co-located; no Storybook deploy  
**Date:** 2026-05-23  
**Author:** Senior Frontend Architect

## Context

Lumni has zero Storybook coverage and no component-level documentation. New engineers struggle to discover available components. Design drift occurs because there is no visual reference.

## Decision

1. **Every new or refactored component** ships with an MDX story in `src/components/**/*.stories.mdx`.
2. **CI blocks merge** on `bunx @biomejs/biome check .` failure. The lint step runs before tests and build.
3. **Storybook deploys** to Vercel on every `main` merge via a dedicated GitHub Actions workflow.
4. **Code review checklist** includes: "Does this PR include a Storybook story?" and "Does `bun run typecheck` pass?"
5. **Package manager:** Bun only. `bun.lockb` is the sole lockfile. `bun install --frozen-lockfile` in CI.

## Consequences

- **Positive:** Living documentation; visual regression testing possible; consistent code quality
- **Negative:** ~10% documentation overhead per PR; initial Storybook setup time

## Related

- `.github/workflows/ci.yml`
- `biome.json`
- `package.json` scripts
