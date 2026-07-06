# Plan 107: Add auth guard to chat route

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7bb0d688..HEAD -- src/app/api/chat/route.ts`
> If this file changed since this plan was written, re-read the live file
> and adjust steps accordingly before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `7bb0d688`, 2026-07-06
- **Issue**: (omit unless published via `--issues`)

## Why this matters

The `POST /api/chat` route accepts arbitrary user messages and forwards them
to AI providers. There is no authentication check — the handler trusts
`checkBudget` (a budget-rate-limiter) to optionally resolve a userId, and
falls back to `userId ?? "anonymous"`. This means:

1. Any unauthenticated caller can consume AI credits at the expense of the
   application's budget (budget is user-namespaced but "anonymous" is a
   shared bucket — one unauthenticated user can exhaust it for everyone).
2. The `buildChatContext()` call fetches user-specific data (competencies,
   progress) from Dexie, but `userId` is never verified at the route level.
3. All other AI routes (`/api/engine/generate`, `/api/engine/grade`,
   `/api/engine/hint`) use `createRouteHandler` with `auth: "required"` or
   explicit `getAuthenticatedUserId()` guards. The chat route is the only
   unprotected AI endpoint.

The fix is to add `getAuthenticatedUserId()` at the handler entry point and
return 401 if the user is not authenticated.

## Current state

The `POST` handler at `src/app/api/chat/route.ts:93`:

```ts
export async function POST(req: NextRequest) {
  const budgetResult = await checkBudget(req, "generate");
  if (!budgetResult.allowed) {
    return budgetResult.response ?? new Response("Budget exceeded", { status: 429 });
  }
  const userId = budgetResult.userId; // may be "anonymous"
  // ...
  await trackUsage("generate", userId ?? "anonymous");
  // ...
}
```

The `createRouteHandler` factory at `src/lib/api/create-route-handler.ts`
supports `auth: "required"` mode which calls `getAuthenticatedUserId()` and
returns 401 if missing. However, the chat route uses streaming (SSE)
responses, which don't fit the factory's `NextResponse.json()` wrapping.
Therefore the pragmatic fix is to add the guard inline.

Available auth helpers in `src/lib/server/auth.ts`:

- `getAuthenticatedUserId(): Promise<string | null>` — reads Appwrite session
  cookie, returns null if not logged in
- `auth(): Promise<string>` — calls `getAuthenticatedUserId()` and throws if
  null

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`      | exit 0, no errors   |
| Tests     | `pnpm run test`           | all pass            |
| Lint      | `pnpm exec oxlint`        | exit 0              |
| Format    | `pnpm exec oxfmt --check` | exit 0              |

## Scope

**In scope**:

- `src/app/api/chat/route.ts` — add auth guard after `checkBudget`

**Out of scope**:

- Refactoring the chat route to use `createRouteHandler` (streaming
  response format is incompatible with the factory's JSON wrapper)
- Adding or removing any tests
- Changing streaming behaviour, rate limiting, or budget logic

## Git workflow

- Branch: `advisor/107-auth-chat-route`
- Commit: `feat: add auth guard to chat route`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add import

In `src/app/api/chat/route.ts`, add:

```ts
import { getAuthenticatedUserId } from "@/lib/server/auth";
```

### Step 2: Add auth guard

In the `POST` handler, immediately after the `checkBudget` block (around
line 98), add:

```ts
const sessionUserId = await getAuthenticatedUserId();
if (!sessionUserId) {
  return Response.json({ error: "Authentication required" }, { status: 401 });
}
```

Then replace all occurrences of `userId ?? "anonymous"` (2 occurrences, on
lines 139 and 189) with `sessionUserId`. The `budgetResult.userId` will
match `sessionUserId` since `checkBudget` resolves the user from the same
Appwrite session, but using the explicitly-checked `sessionUserId` is the
canonical source after the guard.

**Verify**:

```bash
pnpm run typecheck
# → exit 0, no errors
pnpm exec oxlint
# → exit 0
```

### Step 3: Remove budget fallback `?? "anonymous"`

The `userId` variable is now redundant — it was assigned from
`budgetResult.userId` and used with `?? "anonymous"` fallback in two
`trackUsage` calls. Replace the `trackUsage("generate", userId ?? "anonymous")`
calls with `trackUsage("generate", sessionUserId)`.

The `userId` constant (from line 98 `const userId = budgetResult.userId;`)
is still used in the stream and non-stream paths for budget tracking. If
it's only used in the two `trackUsage` calls, you can inline `sessionUserId`
and remove the `userId` constant entirely. If it's used elsewhere, keep it.

Check with:

```bash
rg "userId" src/app/api/chat/route.ts
```

**Verify**:

```bash
pnpm run typecheck
# → exit 0
```

### Step 4: Run full verification

**Verify**:

```bash
pnpm run typecheck
# → exit 0
pnpm run test
# → all pass
pnpm exec oxfmt --check
# → exit 0
pnpm exec oxlint
# → exit 0
```

## Test plan

No test changes needed. The chat route doesn't have a dedicated test file
per the existing pattern. If a test file exists, update it to pass an
authenticated session cookie.

## Done criteria

ALL must hold:

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `pnpm exec oxfmt --check` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `POST /api/chat` returns 401 with `{ "error": "Authentication required" }` when no session cookie is present
- [ ] No `?? "anonymous"` fallback remains in the handler
- [ ] Only `src/app/api/chat/route.ts` is modified

## STOP conditions

Stop and report back (do not improvise) if:

- `getAuthenticatedUserId` is not available or has a different signature in
  `src/lib/server/auth.ts`
- There are consumers of `/api/chat` that call it without authentication
  (e.g. a public-facing widget or landing page chat)
- The `userId` variable from `budgetResult` is used in a way that can't be
  trivially replaced with `sessionUserId`

## Maintenance notes

- The chat route is the only AI endpoint that does streaming. If a future
  `createRouteHandler` enhancement adds streaming support, this route should
  be migrated to the factory pattern for consistency.
- The `createRouteHandler` factory at `src/lib/api/create-route-handler.ts`
  has `auth: "required"` mode that automatically calls
  `getAuthenticatedUserId()`. Once it supports non-JSON response formats,
  this route should be a simple `createRouteHandler({ auth: "required",
budget: "generate", ... })` call.
