# Effect TS Strategy Recommendation

**Date:** 2026-07-05
**Plan:** 095 — Design spike: Effect TS — adopt or abandon
**Status:** Complete (recommendation ready)

## Executive Summary

The project should **Hold at current adoption level** — keep the 17 production files already using Effect (with the `effect` transitive dependency from uploadthing), stop maintaining the scaffolding that was set up for a broader migration (`@effect/language-service`, prepare script, tsconfig plugin), and document the pragmatic boundary. Effect cannot be removed from `node_modules` (it is a transitive dependency of `uploadthing`), so "abandon" would still leave it in the bundle. Full adoption would require migrating ~1000+ files — not justified by the benefits. The current "pragmatic Effect" usage (Effect.gen for async composition, without Context.Tag/Layer/@effect/platform) is productive and low-cost.

## 1. Current Effect Footprint

### Dependencies

| Package                    | Version | Type                       | Source                                                        |
| -------------------------- | ------- | -------------------------- | ------------------------------------------------------------- |
| `effect`                   | 3.21.4  | direct (added by ADR-0013) | Also transitive via `uploadthing` → `@effect/platform@0.90.3` |
| `@effect/language-service` | 0.86.2  | devDependency              | Added by ADR-0013                                             |
| `@effect/platform`         | 0.90.3  | transitive only            | From `uploadthing` (not in our package.json)                  |

**Critical finding:** `effect` is a transitive dependency of `uploadthing` (via `uploadthing → @effect/platform 0.90.3 → effect 3.21.4` and `uploadthing → @uploadthing/shared → effect 3.21.4`). It **cannot be removed** from `node_modules` without removing uploadthing.

### Source code usage — 20 files, ~224 Effect calls

| File                                               | Lines | Effect Calls | Pattern                                   |
| -------------------------------------------------- | ----- | ------------ | ----------------------------------------- |
| `lib/rate-limiter/core.ts`                         | 227   | 29           | Effect.gen, Effect.fail, Effect.all       |
| `lib/ai/cached-ai-generator.ts`                    | 109   | 24           | Effect.gen, Effect.tryPromise, Effect.try |
| `lib/gamification-engine/service.ts`               | 303   | 19           | Effect.gen, Effect.runPromise             |
| `lib/orchestrator/learning-orchestrator.ts`        | 157   | 18           | Effect.gen                                |
| `lib/tinyfish/rag-pipeline.ts`                     | 185   | 17           | Effect.gen gate pipeline                  |
| `lib/retention-loop/next-action.ts`                | 324   | 17           | Effect.gen                                |
| `lib/gamification-engine/service-effects.ts`       | 136   | 14           | Effect.gen (all mutations)                |
| `lib/question-engine/processors/processor.ts`      | 116   | 13           | Effect.gen, Effect.tryPromise             |
| `lib/question-engine/processors/graders/shared.ts` | 172   | 12           | Effect.gen (AI grading)                   |
| `lib/question-engine/question-engine.ts`           | 263   | 12           | Effect.gen                                |
| `lib/services/quiz-result-processor/effects.ts`    | 33    | 8            | Effect.tryPromise + catchAll              |
| `lib/gamification-engine/service-persist.ts`       | 39    | 6            | Effect.tryPromise + persist               |
| `lib/services/quiz-result-processor/quiz.ts`       | 87    | 4            | Effect.gen                                |
| `lib/services/quiz-result-processor/exam.ts`       | 92    | 4            | Effect.gen                                |
| `lib/services/quiz-result-processor/flashcard.ts`  | 78    | 4            | Effect.gen                                |
| `lib/services/quiz-result-processor/bolt.ts`       | 68    | 2            | Effect.gen                                |
| `lib/services/quiz-result-processor/index.ts`      | 43    | 2            | Effect.runPromise dispatch                |
| `lib/question-engine/types/engine-types.ts`        | 156   | 3            | `import type { Effect }` only             |
| _Tests (2 files)_                                  | 437   | 19           | Test-only                                 |

### Patterns used vs NOT used

| Pattern                       | Used in?                   | Files         |
| ----------------------------- | -------------------------- | ------------- |
| `Effect.gen` + `yield*`       | **Yes** — idiomatic        | 13 prod files |
| `Effect.tryPromise`           | **Yes** — pragmatic bridge | 17 prod files |
| `Effect.catchAll`             | **Yes** — error boundary   | 17 prod files |
| `Effect.runPromise` (adapter) | **Yes** — to imperative    | 10+ files     |
| `Effect.all` (concurrency)    | **Yes**                    | rate-limiter  |
| `Effect.fail`                 | **Yes**                    | rate-limiter  |
| `Context.Tag` / `Layer` (DI)  | **No**                     | 0 files       |
| Schema (`effect/Schema`)      | **No**                     | 0 files       |
| `@effect/platform` HttpClient | **No**                     | 0 files       |
| `@effect/vitest`              | **No**                     | 0 files       |

The codebase uses Effect as a **better Promise chain** — sequential async composition with typed error handling — but has **zero adoption** of Effect's DI system (`Context.Tag`, `Layer`), schema validation, or platform modules.

## 2. Migration Cost Estimates

### Option A: Full adoption (migrate everything to Effect)

| Domain                             | Files           | Approx LoC      | Effort        |
| ---------------------------------- | --------------- | --------------- | ------------- |
| AI client (provider chain)         | 1               | 150             | 1 day         |
| Route handlers (API)               | ~100            | ~5,000          | 2 weeks       |
| Service classes (S37-38 extracted) | ~30             | ~3,000          | 1 week        |
| Hooks + components with async      | ~150            | ~7,500          | 3 weeks       |
| Test files (rewrite assertions)    | ~200            | ~10,000         | 2 weeks       |
| Try/catch blocks to migrate        | 107 files       | ~500 blocks     | 1 week        |
| **Total**                          | **~500+ files** | **~25,000 LoC** | **~10 weeks** |

This is unrealistic for a team of 1-2 developers.

### Option B: Abandon (rewrite 17 files + remove scaffolding)

| Task                                       | Files         | Effort        |
| ------------------------------------------ | ------------- | ------------- |
| Rewrite 17 prod files to plain async/await | 17            | 2-3 days      |
| Rewrite 2 test files                       | 2             | 0.5 day       |
| Remove `effect` from direct deps           | 1             | 5 min         |
| Remove `@effect/language-service` dev dep  | 1             | 5 min         |
| Remove prepare script patch                | 1             | 5 min         |
| Remove tsconfig plugin                     | 1             | 5 min         |
| Update ADR-0013                            | 1             | 15 min        |
| Update AGENTS.md                           | 1             | 15 min        |
| **Total**                                  | **~25 files** | **~3-4 days** |

However, Effect **stays in node_modules** anyway (uploadthing transitive dep), and ~40KB min+gzip of Effect remains in the production bundle regardless. The only savings are:

- Simpler mental model (no Effect to learn)
- ~2s per `pnpm install` (language-service patch)
- Slightly smaller node_modules

### Option C: Hold at current level (recommended)

| Task                                           | Files        | Effort      |
| ---------------------------------------------- | ------------ | ----------- |
| Remove `@effect/language-service` dev dep      | 1            | 5 min       |
| Remove prepare script patch                    | 1            | 5 min       |
| Remove tsconfig plugin                         | 1            | 5 min       |
| Update ADR-0013 to "Hold"                      | 1            | 15 min      |
| Update AGENTS.md to reflect pragmatic adoption | 1            | 15 min      |
| **Total**                                      | **~5 files** | **~1 hour** |

## 3. Comparison

| Criterion           | Full Adoption               | Abandon                        | Hold (recommended)                          |
| ------------------- | --------------------------- | ------------------------------ | ------------------------------------------- |
| Bundle cost         | ~40KB (in bundle)           | ~40KB (still from uploadthing) | ~40KB (same)                                |
| Error handling      | Uniform Effect              | try/catch everywhere           | Effect for async chains, try/catch for sync |
| Learning curve      | Steep (1000 files)          | None (remove)                  | Low (documented boundary in 17 files)       |
| Files changed       | ~500+                       | ~25                            | ~5                                          |
| DX friction         | High (dual patterns always) | None                           | Low (patterns already work)                 |
| Prepare script cost | ~2s per install             | Removed                        | Removed                                     |
| Testability         | Layer DI (not used)         | Manual DI (current)            | Manual DI (current)                         |
| Concurrency         | Effect.all                  | Promise.all                    | Both (already working)                      |
| Cost to reach       | ~10 weeks                   | ~3-4 days                      | ~1 hour                                     |

## 4. Recommendation: Hold

**Decision: Keep Effect in the 17 production files that already use it. Remove the scaffolding for broader adoption. Do not expand to Context.Tag/Layer/@effect/platform.**

### Rationale

1. **Effect cannot be removed.** It is a transitive dependency of `uploadthing`. Abandoning source usage saves nothing in bundle size — Effect stays in the production bundle regardless.

2. **17 production files already use Effect productively.** Rewriting them to remove Effect would be churn with zero bundle benefit. The current usage (Effect.gen for async composition, Effect.catchAll for error boundaries) is clean, testable, and working.

3. **The scaffolding was premature.** `@effect/language-service`, the prepare script patch, and the tsconfig plugin were set up expecting a broader migration that never happened. These impose real costs (~2s per install, tsconfig complexity, potential build-time issues) for zero benefit since no one uses language-service features.

4. **Full adoption is unjustified.** ~10 weeks of migration for ~500+ files with a steep learning curve, on a project where the existing imperative patterns work well. The benefits (uniform error handling, Layer DI) are real but not proportional to the cost.

5. **The pragmatic middle ground works.** The codebase has organically converged on a sensible pattern: use Effect when you need sequential async composition with error boundaries (the gamification mutations, RAG pipeline, rate-limiter), use plain async/await for everything else. This is the right level of granularity.

### What changes

| Action                                 | File                               | Reason                                                                                                                                                                           |
| -------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remove `@effect/language-service`      | `package.json` devDependencies     | No one uses language-service features (no Context.Tag, Layer, Schema)                                                                                                            |
| Remove `effect-language-service patch` | `package.json` prepare script      | ~2s per install cost for zero benefit                                                                                                                                            |
| Remove tsconfig plugin                 | `tsconfig.json`                    | Dead config referencing removed package                                                                                                                                          |
| Update status to "Hold"                | `docs/adr/0013-effect-adoption.md` | Replace "Partially Implemented — Evidence Drift" with "Hold — Pragmatic Adoption"                                                                                                |
| Update conventions                     | `AGENTS.md` Effect TS section      | Remove guidance about Context.Tag, Layer, @effect/platform, @effect/vitest. Document the actual pattern: Effect.gen for async composition only, Effect.runPromise at boundaries. |
| Update effect-solutions reference      | `AGENTS.md`                        | Remove reference to cloned Effect v4 repo — not needed for current usage level                                                                                                   |

### What stays

- `effect` as a direct dependency (already present, harmless)
- All 17 production files using Effect — keep as-is
- The `const self = this` + `Effect.gen` pattern — it's the proven template
- `Effect.runPromise` boundary adapter pattern — documented in existing files

### What this unblocks

- No ongoing maintenance burden from @effect/language-service
- New developers/agents learn two patterns (Effect for async chains, try/catch for sync) — not the full Effect ecosystem
- AGENTS.md reflects reality rather than aspirational plans

## 5. Next Steps

1. Remove `@effect/language-service` from `package.json` devDependencies
2. Remove `effect-language-service patch` from the `prepare` script (keep `husky`)
3. Remove `@effect/language-service` from `tsconfig.json` plugins
4. Update `docs/adr/0013-effect-adoption.md` — set status to "Hold — Pragmatic Adoption", remove sections about unfulfilled Phase 2 plans
5. Update `AGENTS.md` Effect TS section — trim to match actual usage (remove Context.Tag/Layer/Schema guidance, remove @effect/vitest, remove reference to cloned Effect v4 repo)
6. Verify: `pnpm install`, `pnpm run typecheck`, `pnpm exec biome check`, `pnpm run test`

**Total implementation effort:** ~1 hour, 5 files changed.
