# Plan 202: Add URL allowlist to admin batch-extract to prevent SSRF

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: none
- **Category**: security
- **Generated at**: 2026-07-17

## Why this matters

The admin batch-extract endpoint at `src/app/api/admin/exams/batch-extract/route.ts` accepts an array of URLs from the authenticated admin user and performs server-side `fetch(url)` for each one. Without validation, a compromised admin account — or a CSRF-like vector — could use this endpoint to probe internal network resources (metadata endpoints, internal services, cloud provider APIs) via Server-Side Request Forgery (SSRF). Even though this route is admin-only, defense-in-depth requires that server-side fetches of user-supplied URLs validate the target against an allowlist.

## Current state

`src/app/api/admin/exams/batch-extract/route.ts:33,41-43`:

```typescript
const results = await Promise.all(
  urls.map(async (url) => {
    const response = await fetch(url); // <-- no URL validation
    // ...
  }),
);
```

URLs are supplied in the request body and passed directly to `fetch()` with no allowlist, no hostname check, and no private-IP rejection.

## Target state

- Every URL is validated against an explicit domain allowlist before `fetch()` is called
- Private/reserved IP ranges (RFC 1918, RFC 4193, link-local, loopback, etc.) are rejected even if DNS resolves to them
- Rejected URLs produce a clear error entry in the results array without aborting the whole batch
- Admin auth gate remains in place

## Scope

- `src/app/api/admin/exams/batch-extract/route.ts` — add validation function, apply before fetch

**Out of scope**:

- Changing the admin auth mechanism
- Adding a database-level allowlist (hardcoded is fine for this admin tool)
- URL validation on other routes

## Steps

### 1. Define the URL validation function

Add a `isAllowedUrl(urlString: string): { allowed: boolean; reason?: string }` function at the top of the route file (or in a shared utility if it already exists — check `src/lib/` first).

The function must:

1. Parse the URL with `new URL(urlString)` — reject if parsing fails
2. Check the hostname against an allowlist. For DBE past papers, the applylist should include at least:
   - `www.education.gov.za`
   - `wcedeportal.co.za`
   - Any other domains already in use by the codebase (check existing `fetch()` calls)
3. Resolve the hostname to IP addresses and reject private/reserved ranges:
   - `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `::1/128`, `fc00::/7`
   - If DNS resolution fails, reject (don't proceed)
4. Reject non-http/https protocols
5. Return `{ allowed: false, reason: "..." }` for each violation

### 2. Integrate validation into the batch loop

Before `fetch(url)`, call `isAllowedUrl(url)`. If `!allowed`, push an error entry to the results array and continue to the next URL:

```typescript
const result = isAllowedUrl(url);
if (!result.allowed) {
  results.push({ url, error: result.reason });
  continue;
}
```

### 3. Keep admin auth gate

Verify the route still has `auth: "required"` or equivalent admin role check at the top. Do not weaken it.

### 4. Verify

```bash
pnpm run typecheck
pnpm exec oxlint --fix
pnpm run test
```

Manually test with:

- A valid DBE URL → should succeed
- `http://localhost:3000/admin` → should be rejected
- `http://10.0.0.1/` → should be rejected
- `file:///etc/passwd` → should be rejected
- An invalid string → should be rejected

## Stop conditions

- If the URL allowlist needs to be configurable per-deployment (not hardcoded) — stop and report. This plan assumes a hardcoded allowlist is sufficient for an admin-only tool.
- If DNS resolution for private-IP checks introduces unacceptable latency — stop and report. The fallback option is to skip IP resolution and rely on hostname allowlist only.

## Estimated time

1–2 hours
