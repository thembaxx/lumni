# Batch 11: Production Hardening & Coverage

Commit baseline: `82a850d3`

## Execution order

Plans within each phase are independent and can be executed in any order
within that phase. Across phases, follow the dependency graph.

### Phase 1 — Security + Correctness (independent)

| #   | Plan                        | Effort | Risk | Depends on | Status |
| --- | --------------------------- | ------ | ---- | ---------- | ------ |
| 146 | Lesson routes auth guard    | S      | LOW  | —          | Draft  |
| 147 | Notification timer leak fix | S      | LOW  | —          | Draft  |
| 148 | Re-engagement route auth    | S      | LOW  | —          | Draft  |
| 149 | Bookmark updateNote fix     | XS     | LOW  | —          | Draft  |
| 150 | Budget identity auth        | XS     | LOW  | 146        | Draft  |
| 151 | Study-sessions auth         | S      | LOW  | 146        | Draft  |

### Phase 2 — Test coverage (independent)

| #   | Plan                       | Effort | Risk | Depends on | Status |
| --- | -------------------------- | ------ | ---- | ---------- | ------ |
| 152 | Auth context tests         | M      | LOW  | —          | Draft  |
| 153 | AI generate route tests    | S      | LOW  | —          | Draft  |
| 155 | School billing route tests | M      | MED  | —          | Draft  |

### Phase 3 — Tech debt (independent)

| #   | Plan                            | Effort | Risk | Depends on | Status |
| --- | ------------------------------- | ------ | ---- | ---------- | ------ |
| 154 | Remove dead image-preprocess.ts | XS     | LOW  | —          | Draft  |
| 156 | Deduplicate calendar exports    | M      | LOW  | —          | Draft  |
| 157 | Move services out of utils/     | S      | LOW  | —          | Draft  |

### Phase 4 — Direction (independent)

| #   | Plan                                  | Effort | Risk | Depends on | Status |
| --- | ------------------------------------- | ------ | ---- | ---------- | ------ |
| 158 | Raise vitest coverage thresholds      | XS     | LOW  | —          | Draft  |
| 159 | Consolidate alert/notification timers | M      | LOW  | —          | Draft  |
| 160 | Migrate bare fetch calls to apiFetch  | M      | LOW  | —          | Draft  |
| 161 | Auth→AI-cost integration test         | M      | MED  | —          | Draft  |

## Individual plan files

Each plan follows the standard template: motivation, current state (with
file excerpts at the commit baseline), scope boundaries, numbered steps,
test plan, done criteria, STOP conditions, and maintenance notes.

- [146-lesson-routes-auth.md](./146-lesson-routes-auth.md)
- [147-notification-timer-leak.md](./147-notification-timer-leak.md)
- [148-re-engagement-route-auth.md](./148-re-engagement-route-auth.md)
- [149-bookmark-updatenote-fix.md](./149-bookmark-updatenote-fix.md)
- [150-budget-identity-auth.md](./150-budget-identity-auth.md)
- [151-study-sessions-auth.md](./151-study-sessions-auth.md)
- [152-auth-context-tests.md](./152-auth-context-tests.md)
- [153-generate-route-tests.md](./153-generate-route-tests.md)
- [154-remove-image-preprocess.md](./154-remove-image-preprocess.md)
- [155-school-billing-tests.md](./155-school-billing-tests.md)
- [156-deduplicate-calendar-exports.md](./156-deduplicate-calendar-exports.md)
- [157-move-services-out-of-utils.md](./157-move-services-out-of-utils.md)
- [158-raise-test-thresholds.md](./158-raise-test-thresholds.md)
- [159-consolidate-alert-timers.md](./159-consolidate-alert-timers.md)
- [160-apifetch-migration.md](./160-apifetch-migration.md)
- [161-auth-ai-cost-integration-test.md](./161-auth-ai-cost-integration-test.md)

## Verification baseline

Before any execution, verify the baseline:

```bash
pnpm run typecheck     # 0 errors
pnpm run test          # ~1520 pass, 0 fail
pnpm exec oxlint       # 0 warnings on changed files
pnpm exec oxfmt --check # all formatted
```

After each plan, re-run the affected subset of tests and lint.

## Rejected findings

These were investigated during audit and explicitly decided against creating
a plan. See the individual finding notes for reasoning.

| Finding                   | Why rejected                                         |
| ------------------------- | ---------------------------------------------------- |
| Missing `aria-labels`     | Already addressed in Session 23; no new issues found |
| Sentry `beforeSend` block | Correctly gated by user consent; no change needed    |
| Dexie migration gap       | All current migrations are in order; no script gap   |
| Appwrite duplicate writes | Existing sync layer handles Appwrite→Dexie properly  |
| Empty catch blocks        | Most have `logError` calls from Session 23 pass      |
