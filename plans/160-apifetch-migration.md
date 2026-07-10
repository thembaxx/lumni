# Plan 160: Migrate bare fetch calls to apiFetch

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/lib/shared/api-fetch.ts`
> If api-fetch.ts changed since this plan was written, treat it as a STOP
> condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

The codebase has a shared `apiFetch` wrapper in `src/lib/shared/api-fetch.ts`
that handles auth headers, error handling, JSON parsing, and base URL
configuration. However, ~15+ call sites still use bare `fetch()` directly
with the Next.js API routes. This means:

- Auth headers are manually injected (or worse, forgotten)
- Error responses are handled inconsistently (some check `res.ok`, some check
  `res.status`, some check `res.json().error`)
- JSON body serialisation is manual
- If the base URL convention changes, every bare fetch must be found and
  updated individually

## Current state

Find bare fetch calls that target `/api/` routes:

```bash
rg "fetch\(.*/api/" src/ --include '*.{ts,tsx}' -n
```

Also look for `fetch(` that construct URLs with template strings referencing
`/api/`.

The `apiFetch` signature (from existing usage):

```typescript
// apiFetch<T>(url, options?) → Promise<T>
// - Auto-prefixes with base URL
// - Injects auth headers from the auth context
// - Throws on non-2xx responses with structured error
// - Parses JSON response automatically
```

## Scope

**In scope**:

- All bare `fetch()` calls in `src/` that target `/api/*` routes

**Out of scope**:

- Do NOT migrate `fetch()` calls that target external APIs (Stripe,
  Appwrite, Deepgram, etc.)
- Do NOT migrate `fetch()` calls in route handlers (server-side — they
  target external services, not internal APIs)
- Do NOT change the `apiFetch` function itself

## Git workflow

- Branch: `advisor/160-apifetch-migration`
- Commit message: `refactor: migrate bare /api fetch calls to apiFetch`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Find all candidate call sites

```bash
rg "fetch\(`/api/" src/ --include '*.{ts,tsx}' -n
rg 'fetch\("/api/' src/ --include '*.{ts,tsx}' -n
rg "fetch\(.*'/api/" src/ --include '*.{ts,tsx}' -n
```

Also check for files that use `fetch(` with a variable that resolves to an
API URL:

```bash
# Also look for any non-import use of fetch that could target /api
rg "(^|  |\t)(fetch\(|const.*= await fetch|\.then\(fetch)" src/ --include '*.{ts,tsx}' -n | grep -i api
```

### Step 2: Migrate each call site

For each file found, make the following transformation:

BEFORE:

```typescript
const res = await fetch(`/api/engine/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ subject, count }),
});
if (!res.ok) {
  const err = await res.json();
  throw new Error(err.error ?? "Generation failed");
}
const data = await res.json();
return data;
```

AFTER:

```typescript
import { apiFetch } from "@/lib/shared/api-fetch";
return apiFetch(`/api/engine/generate`, {
  method: "POST",
  body: { subject, count },
});
```

(With `apiFetch`, body is auto-stringified, auth headers are auto-injected,
error handling is centralised, and JSON parsing is automatic.)

**Verify after each file**: `pnpm run typecheck` on the file.

### Step 3: Update ts-expect-error or test mocks if needed

Some call sites may have `// @ts-expect-error` comments because bare `fetch`
returns `Response` but the caller expects typed data. After migrating to
`apiFetch` (which returns `T`), these comments may become unnecessary.
Remove them.

If test files mock `fetch` directly (e.g.,
`vi.spyOn(globalThis, "fetch")`), they may need to be updated to mock
`apiFetch` instead — or the mock can remain if the test still works.

**Verify**: `pnpm run test` → no regressions.

## Test plan

- Run full test suite: `pnpm run test` — 0 regressions expected
- Each call site migration is a mechanical transformation — no behavioural
  change
- If a call site uses `fetch` with unconventional options (e.g., streaming,
  blob response), test manually or skip that site

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, no regressions
- [ ] `pnpm exec oxlint` — zero warnings on all changed files
- [ ] `rg "fetch\(`/api|fetch\(.\*'/api|fetch\(\"/api"` src/` returns 0
      results matching internal API calls (only external API calls remain)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- A call site uses `fetch` with `Response.blob()` or `Response.arrayBuffer()`
  or streaming (`response.body.getReader()`). `apiFetch` auto-parses JSON, so
  these call sites should NOT be migrated. Mark them with a comment:
  `// non-JSON fetch - cannot use apiFetch`
- A call site has custom retry logic, abort handling, or middleware that
  `apiFetch` doesn't support. Skip those and document why.
- There are more than 30 call sites. If so, batch the migration into 2-3
  smaller PRs by domain.

## Maintenance notes

- New features should always use `apiFetch` for internal API calls. Add this
  as a lint rule or convention.
- If `apiFetch` lacks a feature that multiple call sites need (e.g., request
  cancellation), extend `apiFetch` rather than introducing new bare `fetch`
  calls.
