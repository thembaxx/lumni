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

## Disposition (Session 41 — June 2026)

The tooling and workflow diverged from this ADR:

1. **Biome.js** → was briefly configured but replaced by **oxlint** (`pnpm exec oxlint`) and **oxfmt** (`pnpm exec oxfmt --check`) for lint/format. These are faster (Rust-based) and catch more rules.
2. **Package manager: Bun** → was used briefly but replaced by **pnpm** (better workspace support, more stable lockfile format `pnpm-lock.yaml`).
3. **Storybook** → installed (`storybook@10.4.1`), has 18 stories, builds successfully. But **deploy is manual** — no CI/CD deploy on merge. Stories are centralized in `src/components/stories/` (not co-located `.stories.mdx`). Used for development reference, not living documentation.
4. **MDX sync** → never implemented. Components have no MDX documentation.
5. **Code review checklist** → never formalized.

The ADR was correct in *intent* (Storybook coverage is valuable) but the specific tool choices and workflow mechanics were wrong.

**Verdict:** Toolchain evolved differently. ADR-0006 is formally **Rejected**.

## Related

- `.github/workflows/ci.yml` — uses `oxlint`, `oxfmt --check`, `vitest`
- `src/components/stories/` — 18 Storybook stories
- `package.json` — scripts: `lint`, `typecheck`, `test`, `format:check`, `deadcode`
