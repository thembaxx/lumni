# Plan 007: Add SSRF guard to admin batch-extract endpoint

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat be3a4dfb..HEAD -- src/app/api/admin/exams/batch-extract/route.ts`
> If the file changed, read the full current source before proceeding.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `be3a4dfb`, 2026-07-09

## Why this matters

The `POST /api/admin/exams/batch-extract` endpoint accepts an array of URLs from the request body and fetches each one with `fetch(url)`, saving the response text to disk. While the endpoint is auth-gated to admin users, an admin compromise or leaked admin token allows SSRF to any internal network resource — AWS metadata endpoint (`169.254.169.254`), Redis, internal APIs, database proxies. The response content is written to the server filesystem. This is a high-impact pivot vector.

## Current state

```typescript
// src/app/api/admin/exams/batch-extract/route.ts:33-59
execute: async ({ body }) => {
  const { urls } = body as { urls: string[] };
  const outputDir = path.resolve(process.cwd(), "exam-data", "extracted");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "no-store" });  // line 43 — SSRF vector
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        const fileName = `extracted_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.txt`;
        fs.writeFileSync(path.join(outputDir, fileName), text, "utf-8");
        return { url, success: true };
      } catch (error) {
        return { url, success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    }),
  );
```

The `validate` function (line 29) only checks `body.urls` is an array — no validation of URL schemes, hosts, or IP ranges.

**Repo conventions to match:**

- `HttpError` from `@/lib/api/create-route-handler` for error responses
- Validation returns a string error message or null
- `logError` from `@/lib/shared/logger` for logging
- The existing pattern for validation in `createRouteHandler` returns from the `validate` callback

## Commands needed

| Purpose   | Command            | Expected on success |
| --------- | ------------------ | ------------------- |
| Typecheck | `pnpm typecheck`   | exit 0              |
| Tests     | `pnpm run test`    | all pass            |
| Lint      | `pnpm exec oxlint` | exit 0              |

## Scope

**In scope:**

- `src/app/api/admin/exams/batch-extract/route.ts` — add URL validation

**Out of scope:**

- Any other route
- The `fetch` behavior itself — only the URL validation changes
- The filesystem write behavior

## Steps

### Step 1: Add URL validation

Add a `validateUrl` function that checks each URL against these rules:

1. **Scheme**: Must be `https://` only (reject `http://`, `ftp://`, `file://`, etc.)
2. **Host**: Must not resolve to private IP ranges. Accept string URLs; parse them to extract the hostname. Reject if hostname is:
   - `localhost`, `127.0.0.1`, `[::1]`
   - `10.x.x.x` (private class A)
   - `172.16.0.0` – `172.31.255.255` (private class B)
   - `192.168.x.x` (private class C)
   - `169.254.x.x` (link-local)
   - Any AWS metadata address (hostname containing `169.254.169.254`)

Place the check in the `validate` callback so it rejects the request before `execute` runs:

```typescript
validate: (body: Record<string, unknown>) => {
  if (!body.urls || !Array.isArray(body.urls)) return "Missing or invalid urls array";

  for (const url of body.urls) {
    if (typeof url !== "string") return `Invalid URL: ${url}`;

    // Check scheme
    if (!url.startsWith("https://")) return `Rejected non-HTTPS URL: ${url.substring(0, 50)}`;

    // Extract hostname
    let hostname: string;
    try {
      const parsed = new URL(url);
      hostname = parsed.hostname;
    } catch {
      return `Invalid URL: ${url.substring(0, 50)}`;
    }

    // Block private IPs
    const privateRanges = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|127\.|0\.)/;
    if (privateRanges.test(hostname)) return `Blocked private IP range: ${hostname}`;

    // Block localhost hostnames
    if (hostname === "localhost" || hostname === "[::1]" || hostname.startsWith("127.")) {
      return `Blocked localhost: ${hostname}`;
    }
  }

  return null;
},
```

**Verify**: `pnpm typecheck` → exit 0

### Step 2: Run full gate

**Verify**:

- `pnpm typecheck` → exit 0
- `pnpm exec oxlint` → exit 0
- `pnpm run test` → all pass

## Test plan

The batch-extract route has no existing tests. Add a simple test or verify with the full suite that no regressions occur.

**Recommended** (optional): Verify the validation logic by reading the code once more after writing it. The tests for `createRouteHandler` ensure the `validate` callback is called before `execute`.

If you want to add tests, create `src/app/api/admin/exams/__tests__/batch-extract.test.ts` with cases:

1. Empty array → validation error
2. `http://example.com/file.pdf` → rejected (non-HTTPS)
3. `https://192.168.1.1/data.json` → rejected (private IP)
4. `https://169.254.169.254/latest/meta-data/` → rejected (AWS metadata)
5. `https://valid-external-site.com/paper.pdf` → allowed (validate passes)

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm run test` — all pass
- [ ] `pnpm exec oxlint` — zero warnings on the changed file
- [ ] The `validate` callback in batch-extract rejects: non-HTTPS URLs, private IP ranges, localhost, AWS metadata endpoint
- [ ] The validation happens before any `fetch()` call
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report if:

- The route file structure differs from the excerpt (e.g., the `validate` callback is not separate from `execute`)
- `new URL(url)` throws for unexpected edge cases (it throws on malformed URLs — that's caught by the try/catch)
- The validation blocks legitimate external URLs that users need (e.g., DBE exam paper PDFs hosted on `https://www.education.gov.za/`) — check a real DBE URL pattern)
- TypeScript errors about regex patterns (use `RegExp` or inline regex; TS6 should handle both)

## Maintenance notes

- If the platform ever needs to fetch from an internal API (e.g., a caching proxy on the same VPC), add an allowlist for known internal hosts.
- The private IP regex is a string-based heuristic — it catches the common ranges but may miss IPv6-mapped private addresses. For a production hardening pass, consider a DNS resolution check.
- This guard protects against admin-credential pivot attacks. The endpoint is admin-only, so the primary threat is credential theft.
