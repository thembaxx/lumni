# Plan 207: Migrate knowledge-graph GET handler to createRouteHandler for consistent security headers

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Generated at**: 2026-07-17

## Why this matters

The `GET /api/engine/knowledge-graph` route at `src/app/api/engine/knowledge-graph/route.ts:27-39` uses `Response.json()` directly instead of the `createRouteHandler` factory. This means it misses the automatic security headers (CSP, X-Frame-Options, etc.) that the factory applies to all other API routes. It also lacks the standardized auth guard, error wrapping, and rate limiting that the factory provides. Every API route should use the same handler infrastructure so security guarantees are uniform.

## Current state

`src/app/api/engine/knowledge-graph/route.ts:27-39`:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const result = await fetchKnowledgeGraph(/* ... */);
  return Response.json(result);
}
```

No `createRouteHandler`, no auth guard, no security headers, no error wrapping.

## Target state

The GET handler is wrapped in `createRouteHandler` with `auth: "required"`, automatic security headers, error wrapping, and (if applicable) rate limiting.

## Scope

- `src/app/api/engine/knowledge-graph/route.ts` — convert GET handler to use createRouteHandler

**Out of scope**:

- The knowledge graph service logic (`fetchKnowledgeGraph`)
- The POST handler (may already use createRouteHandler — verify)

## Steps

### 1. Read the full route file

Read `src/app/api/engine/knowledge-graph/route.ts` to understand both GET and POST handlers. The POST handler may already use `createRouteHandler` — if so, use it as a reference for the GET conversion.

### 2. Convert GET to use createRouteHandler

Replace the raw `export async function GET` with:

```typescript
export const GET = createRouteHandler({
  auth: "required",
  handler: async ({ userId }, request) => {
    const { searchParams } = new URL(request.url);
    const result = await fetchKnowledgeGraph(/* ... */);
    return { data: result };
  },
});
```

The factory's `handler` return value is automatically serialized to `Response.json()` with security headers applied.

### 3. Remove manual Response.json() calls

If the handler body contained any `Response.json()` or `NextResponse.json()` calls, replace them with plain object returns. If there were error branches that returned `NextResponse.json({ error }, { status })`, replace them with throwing an appropriate `HttpError` (if the factory supports it) or returning `{ error, status }`.

### 4. Verify

```bash
pnpm run typecheck
pnpm exec oxlint --fix
pnpm run test
```

Also manually verify the response headers include security headers (X-Frame-Options, X-Content-Type-Options, etc.) by inspecting a response via curl or browser dev tools.

## Stop conditions

- If `createRouteHandler` does not support GET handlers (only POST) — stop and report.
- If the knowledge graph GET endpoint is called from external/public contexts that don't send auth cookies — switching to `auth: "required"` would break those callers. If the endpoint is used for prefetching or public embedding, use `auth: "optional"` instead.

## Estimated time

30 minutes
