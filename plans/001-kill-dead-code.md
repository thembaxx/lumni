# Plan 001: Kill dead code + fix broken scripts

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c91fa0d4..HEAD -- package.json src/app/api/referral/ src/app/api/study-groups/ src/app/api/teacher/ src/app/api/admin/ src/app/api/assignments/ src/app/api/exam-papers/ src/app/api/exam-sessions/ src/app/api/ghost/ src/app/api/lessons/ src/app/api/q/ src/app/api/student/ src/app/api/sync/ src/app/api/study-buddies/ src/lib/shared/flags/ .env.example`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `c91fa0d4`, 2026-07-10
- **Issue**: (none)

## Why this matters

33 empty API route stubs, 3 broken npm scripts, dead env vars from removed premium gating, and a fully-rolled-out feature flag still branching. Each one costs a developer time on every grep, every "why does this script fail", every setup. Cleaning them takes <30 minutes, and after that the codebase is smaller, faster to typecheck, and honest about what works.

## Current state

- `package.json:13` — `"db:migrate": "tsx src/lib/db/migrate.ts"` — file does not exist
- `package.json:14` — `"db:sync": "tsx src/lib/db/sync/cli.ts"` — file does not exist
- `package.json:36` — `"embed:backfill": "tsx scripts/embed-backfill.ts"` — file does not exist
- 33 empty API route files (listed below) — each contains `0 bytes`
- `src/lib/shared/flags/registry.ts` — `swipeable-flashcards` flag has `defaultEnabled: true` meaning it's a no-op kill switch, fully rolled out since Session 13
- `.env.example` — `NEXT_PUBLIC_STRIPE_PRICE_ID_*`, `NEXT_PUBLIC_DEFAULT_USER_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `PAYFAST_*` — all from removed premium gating (Session 36), zero usages
- `src/app/api/referral/generate/route.ts` — POST endpoint no frontend calls; GET `/info` already auto-creates codes

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Install   | `pnpm install`            | exit 0              |
| Typecheck | `pnpm run typecheck`      | exit 0, no errors   |
| Tests     | `pnpm run test -- --run`  | all pass            |
| Lint      | `pnpm exec oxlint --fix`  | exit 0              |
| Format    | `pnpm exec oxfmt --check` | clean               |

## Scope

**In scope**:

- `package.json` — remove 3 broken scripts
- 33 empty API route files (delete them)
- `src/lib/shared/flags/registry.ts` — remove `swipeable-flashcards` entry and its call sites
- `.env.example` — remove dead vars from removed premium gating
- `src/app/api/referral/generate/route.ts` — delete (dead endpoint)

**Out of scope**:

- Do NOT rename/restructure non-empty API routes
- Do NOT refactor the flags system itself — only remove the single dead flag
- Do NOT touch `src/lib/db/constants.ts` — `FLASHCARD_REVIEWS` etc. are separate concerns

## Git workflow

- Branch: `advisor/001-kill-dead-code`
- Commit per logical step (scripts, empty routes, flags, env.example)
- Message style: conventional commits — `chore: remove broken package.json scripts` etc.

## Steps

### Step 1: Remove 3 broken scripts from package.json

Edit `package.json`:

- Remove `"db:migrate"` line
- Remove `"db:sync"` line
- Remove `"embed:backfill"` line

**Verify**: `pnpm install` → exit 0. `pnpm run typecheck` → exit 0.

### Step 2: Delete 33 empty API route files

These are all 0-byte files. Delete them:

**Study groups (17 files)**:

```
src/app/api/study-groups/[groupId]/route.ts
src/app/api/study-groups/[groupId]/badges/route.ts
src/app/api/study-groups/[groupId]/challenge/route.ts
src/app/api/study-groups/[groupId]/leave/route.ts
src/app/api/study-groups/[groupId]/live-session/route.ts
src/app/api/study-groups/[groupId]/live-session/[sessionId]/route.ts
src/app/api/study-groups/[groupId]/members/route.ts
src/app/api/study-groups/[groupId]/members/[memberId]/route.ts
src/app/api/study-groups/[groupId]/members/[memberId]/co-admin/route.ts
src/app/api/study-groups/[groupId]/members/[memberId]/mute/route.ts
src/app/api/study-groups/[groupId]/pin/route.ts
src/app/api/study-groups/[groupId]/posts/route.ts
src/app/api/study-groups/[groupId]/posts/[postId]/comments/route.ts
src/app/api/study-groups/[groupId]/posts/[postId]/reactions/route.ts
src/app/api/study-groups/comments/[commentId]/route.ts
src/app/api/study-groups/comments/[commentId]/reactions/route.ts
src/app/api/study-groups/posts/[postId]/route.ts
```

**Teacher (3 files)**:

```
src/app/api/teacher/assignments/[id]/grades/route.ts
src/app/api/teacher/assignments/[id]/messages/route.ts
src/app/api/teacher/students/[studentId]/report/route.ts
```

**Other (13 files)**:

```
src/app/api/admin/exams/[id]/route.ts
src/app/api/admin/schools/[schoolId]/route.ts
src/app/api/assignments/[id]/comment/route.ts
src/app/api/assignments/[id]/submit/route.ts
src/app/api/exam-papers/[id]/route.ts
src/app/api/exam-papers/[id]/extract/route.ts
src/app/api/exam-sessions/[id]/route.ts
src/app/api/ghost/[token]/route.ts
src/app/api/lessons/[subjectId]/[subtopicId]/route.ts
src/app/api/q/[id]/route.ts
src/app/api/student/assignments/[id]/submit/route.ts
src/app/api/study-buddies/commitments/[id]/route.ts
```

Also delete `src/app/api/referral/generate/route.ts` (dead POST, GET `/info` already works).

**Verify**: `pnpm run typecheck` → exit 0. All 34 files are gone.

### Step 3: Remove fully rolled-out `swipeable-flashcards` flag

Current state in `src/lib/shared/flags/registry.ts`:

```typescript
"swipeable-flashcards": { defaultEnabled: true }   // Kill switch — fully rolled out
```

Remove this entry from the registry object. Then find all call sites by searching for `"swipeable-flashcards"` in `src/` — there should be 0 since it was always-on. If any exist, remove the conditional branches and keep the enabled path.

**Verify**: `grep -rn "swipeable-flashcards" src/` → no matches.

### Step 4: Clean dead env vars from `.env.example`

Current state in `.env.example`:

```
NEXT_PUBLIC_DEFAULT_USER_ID=          # Line ~7 — zero usages
NEXT_PUBLIC_BUILD_VERSION=            # Never set by CI — zero effect
NEXT_PUBLIC_COMMIT_HASH=              # Never set by CI — zero effect
NEXT_PUBLIC_BUILD_TIMESTAMP=          # Never set by CI — zero effect
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=  # Premium gating removed
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=   # Premium gating removed
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # Premium gating removed
PAYFAST_MERCHANT_ID=                  # Payfast never built
PAYFAST_MERCHANT_KEY=                 # Payfast never built
PAYFAST_PASSPHRASE=                   # Payfast never built
PAYFAST_RETURN_URL=                   # Payfast never built
PAYFAST_CANCEL_URL=                   # Payfast never built
PAYFAST_NOTIFY_URL=                   # Payfast never built
```

Remove the lines above. Also check if `app.config.ts` references the build vars — if so, inline their defaults and remove the env var reads.

**Verify**: `pnpm run typecheck` → exit 0. All env vars mentioned above are gone from `.env.example`.

## Test plan

Run the full test suite — the changes are deletions, so regressions are unlikely, but verify nothing is being imported.

- `pnpm run test -- --run` → all 2000+ tests pass

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run` exits 0
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] `pnpm exec oxfmt --check` exits clean
- [ ] 34 API route files deleted (33 empty + 1 dead referral/generate)
- [ ] `grep -rn "swipeable-flashcards" src/` returns no matches
- [ ] `grep -rn "embed:backfill\|db:migrate\|db:sync" package.json` returns no matches
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any deleted file is imported by another file (verify with grep before deleting)
- Any non-empty route is mistaken for an empty stub
- Typecheck fails due to a missing export that relied on the deleted file

## Maintenance notes

- The 34 stubs were scaffolded by the feature-planning process. In the future, plan files for new features should not include empty route files unless the route handler is written in the same PR.
- If new env vars are added later, they should be grouped with a section header in `.env.example`.
