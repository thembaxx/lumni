---
status: TODO
priority: P2
effort: M
risk: HIGH
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 178 — Spike: upgrade off the Next.js preview build

## Context

The app is pinned to `next@16.3.0-preview.5` (plus `@next/bundle-analyzer` and `@next/playwright` at the same preview). A preview/non-GA runtime carries elevated risk: breaking API changes between preview cuts, weaker security backports, weaker community coverage, and a forced coordinated upgrade of the `@next/*` companions. This is a stability/security liability worth a deliberate spike rather than an in-place bump.

## Current state (verified)

`package.json:81` `"next": "16.3.0-preview.5"`
`package.json:112-113` `"@next/bundle-analyzer": "16.3.0-preview.5"`, `"@next/playwright": "16.3.0-preview.5"`

## Goal

Determine whether a GA `next@16.x` exists, whether the app builds/tests on it, and produce a concrete upgrade plan (or document that staying on the preview is currently required and why).

## Steps

1. Check the latest published `next` 16.x: `pnpm view next dist-tags --json` and `pnpm view next versions --json` (read-only; do not install yet). Note the newest `16.x` that is NOT a `-preview`/`-canary`/`-rc`.
2. Read `node_modules/next/dist/docs/` (per the project's Next.js agent rules) for any breaking changes between `16.3.0-preview.5` and the target GA, focusing on: `cacheComponents` removal (already removed in Session 43), `experimental.viewTransition`, `reactCompiler`, App Router APIs, and any removed/renamed config keys in `next.config.ts`.
3. Branch and attempt the bump in a throwaway way: update `package.json` to the target GA for `next`, `@next/bundle-analyzer`, `@next/playwright`; run `pnpm install` (allowed only in the spike branch, not the user's tree), then:
   - `pnpm run typecheck`
   - `pnpm run build`
   - `pnpm run test`
   - `pnpm test:e2e` (at least smoke)
4. Record every breakage and whether it is a code fix or a config change. Classify each as S/M/L.
5. Either (a) produce a follow-up implementation plan with the exact version + fix list, or (b) document why the preview must remain (e.g. a required feature only in preview) and add a tracking note.

## Scope

- In scope: `package.json` deps, `next.config.ts` compatibility, build/type/test verification.
- Out of scope: application logic changes unrelated to the Next bump (fix only what the bump breaks).

## Done criteria (spike output)

- A written decision: target version + list of required fixes (with effort), OR a documented justification for staying on preview.
- If proceeding to implement: `pnpm run typecheck`, `pnpm run build`, `pnpm run test`, `pnpm test:e2e` all green on the bumped version.

## Test plan

- The spike's own verification IS the test: typecheck + build + unit + e2e must pass on the candidate GA.

## Maintenance

- Once on GA, avoid re-pinning to previews. Add a CI note/dependabot watch on `next` GA releases.

## Escape hatches

- If the only GA available is a major-version jump with large breaking changes, STOP and recommend staying on the preview with a documented review cadence rather than a risky major upgrade. Report findings; do not force the bump.
- This plan is a SPIKE — do not merge a version change to the user's branch without explicit go-ahead. Verify in an isolated worktree/branch only.
