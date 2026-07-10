# Plan 152: Add characterization tests for auth-context.tsx

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/lib/auth/`
> If any file under `src/lib/auth/` changed since this plan was written,
> compare the "Current state" excerpts against the live code before proceeding;
> on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

`src/lib/auth/auth-context.tsx` (264 lines, 25 git touches in 6 months) is the
single most security-critical file in the codebase. It orchestrates 5 auth
methods (anonymous, Google OAuth, magic link, email/password, email
verification), the entire `useEffect` init lifecycle, rate limiting, sign-out
with cache flush, and profile updates. It has zero test coverage. A regression
here means users can't log in — and with no characterization tests, the
regression goes to production.

## Current state

The file at `src/lib/auth/auth-context.tsx` exports an `AuthProvider` component
and the `useAuth()` hook. It uses:

- A reducer pattern (`AuthState`, `AuthAction` types from `auth-types.ts`)
- Appwrite SDK `account` object for all auth API calls
- A `useEffect` for session initialization on mount (lines ~37-80)
- Rate limiting via `checkRateLimit("sign-in")`

The reducer has branches: `SET_USER`, `SET_ERROR`, `SET_AUTH_READY`,
`CLEAR_ERROR`, `SET_LOADING`.

The hook exposes: `user`, `isAuthReady`, `isAnonymous`, `error`, `signIn`,
`signUp`, `signOut`, `sendMagicLink`, `verifyEmail`, `updateProfile`, loading
state, and rate-limit helpers.

Test pattern to follow: look at `src/hooks/__tests__/` for examples of how
existing hook tests are structured. The test setup at
`src/hooks/__tests__/setup.ts` configures happy-dom and `fake-indexeddb`.

## Scope

**In scope**:

- `src/lib/auth/__tests__/auth-context.test.tsx` (create)

**Out of scope**:

- Do NOT change `auth-context.tsx` itself
- Do NOT test the `AuthProvider` wrapper component — focus on the hook
  behavior through a test component
- Do NOT test the Appwrite SDK itself — mock it at the boundary
- Do NOT test `auth-types.ts` (the reducer types are purely structural)

## Git workflow

- Branch: `advisor/152-auth-context-tests`
- Commit message: `test: add characterization tests for auth-context`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create test file

Create `src/lib/auth/__tests__/auth-context.test.tsx`.

Start with a minimal test that mocks the Appwrite SDK and renders the provider:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "../auth-context";

// Mock the Appwrite account module
vi.mock("@/lib/appwrite", () => ({
  account: {
    get: vi.fn(),
    createAnonymousSession: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
    updateEmail: vi.fn(),
    updatePassword: vi.fn(),
    updateName: vi.fn(),
    createVerification: vi.fn(),
    updateVerification: vi.fn(),
  },
}));

function TestConsumer() {
  // Access auth context and render state for assertions
  // ...
}

describe("auth-context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests here
});
```

### Step 2: Write characterization tests

Cover these cases — model each after an existing test pattern in the codebase
(e.g., `src/hooks/__tests__/use-gamification.test.tsx`):

1. **Initial state** — renders with `isAuthReady: false`, `user: null`
2. **Session init on mount** — `account.get()` is called during mount; when it
   returns a user, `isAuthReady` becomes true and `user` is populated
3. **Anonymous session creation** — when `account.get()` throws, the provider
   falls back to `createAnonymousSession()`; verify fallback fires
4. **Sign in** — `signIn(email, password)` calls
   `account.createEmailPasswordSession(email, password)` then refreshes the user
5. **Sign out** — `signOut()` calls `account.deleteSession("current")` and
   resets user to null
6. **Magic link** — `sendMagicLink(email)` calls
   `account.createSession(email)` with correct params
7. **Rate limiting** — calling sign-in too frequently returns an error or
   blocks the call; verify the rate-limit check fires
8. **Update profile** — `updateProfile({ name })` calls `account.updateName()`
   and updates the user state

Each test should:

- Set up the mock before render
- Render `<AuthProvider><TestConsumer /></AuthProvider>`
- Await state changes
- Assert on the rendered output (text content) AND that the correct mock
  function was called with the right arguments

**Verify**: `pnpm run test -- src/lib/auth/` → new tests pass.

## Test plan

All test cases listed in Step 2. That's 8 characterization tests.

**Mock strategy**: Mock `@/lib/appwrite`'s `account` object (as shown above).
Do NOT mock `@/lib/shared/logger` or `@/lib/shared/rate-limiter` — each test
should control whether rate limiting fires by the sequence of calls it makes.
If needed, mock the rate limiter to allow unlimited calls:

```typescript
vi.mock("@/lib/shared/rate-limiter", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}));
```

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- src/lib/auth/` exits 0, 8+ new tests pass
- [ ] `pnpm exec oxlint` — zero warnings on the test file
- [ ] All 8 test cases from Step 2 exist and pass
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `auth-context.tsx` uses a pattern that makes hook-level testing impossible
  (e.g., the hook is only accessible through a React tree that requires
  Appwrite SDK config). If so, the test pattern should use
  `renderHook(() => useAuth(), { wrapper: AuthProvider })`.
- The Appwrite SDK mock is complex enough to warrant a shared mock file.
  Create `src/lib/auth/__tests__/appwrite-mock.ts` if this is the case.

## Maintenance notes

- These are characterization tests — they capture current behaviour. If auth
  behaviour changes (e.g., adding a new social login provider), update or add
  tests in this file.
- The mock should be kept in sync with the actual Appwrite SDK interface used
  by `auth-context.tsx`. If a new method is called from the context, add it
  to the mock.
