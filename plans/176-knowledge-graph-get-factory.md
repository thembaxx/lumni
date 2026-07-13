---
status: TODO
priority: P2
effort: S
risk: LOW
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 176 — `knowledge-graph` GET bypasses `createRouteHandler`

## Context

The `knowledge-graph` route's `POST` correctly uses `createRouteHandler` (auth guard, `HttpError` wrapping, validation), but its `GET` is a raw `export const GET = async (request) => {...}` that hand-rolls auth via `getAuthenticatedUserId()` and manual `Response.json` status codes. This is an inconsistency vs the ~149 factory-migrated routes and misses the factory's uniform error handling/rate-limiting.

## Current state (verified)

`src/app/api/engine/knowledge-graph/route.ts:27-39`

```ts
export const GET = async (request: NextRequest) => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ error: "Authentication required" }, { status: 401 });
  const subject = request.nextUrl.searchParams.get("subject");
  const topic = request.nextUrl.searchParams.get("topic");
  if (!subject || !topic)
    return Response.json({ error: "subject and topic are required" }, { status: 400 });
  const graph = await handleGraphFetch(subject, topic);
  return Response.json(graph);
};
```

POST (lines 41-52) already uses `createRouteHandler`.

## Goal

Migrate the GET handler to `createRouteHandler` for uniform auth/validation/error handling.

## Steps

1. Convert `GET` to use `createRouteHandler` with `auth: "required"` and a `parseQuery`/validation step that reads `subject`/`topic` from `request.nextUrl.searchParams` (the factory supports query parsing — check `createRouteHandler` signature in `src/lib/api/create-route-handler.ts`).
2. If the factory does not support query params directly, keep a thin GET that extracts params then delegates to a shared handler, OR convert the consumer to call POST. Prefer using the factory if it supports `searchParams`.
3. Reuse the existing `handleGraphFetch` helper (already shared by POST).
4. Verify the one consumer of this GET (grep `knowledge-graph` usage in `src`) still works with the factory's response envelope (factories may wrap the body — confirm shape matches what the client expects).
5. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/app/api/engine/knowledge-graph/route.ts`.
- Out of scope: `handleGraphFetch`, the knowledge-graph service, the POST handler.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/app/api/engine/knowledge-graph` → pass (add/extend a test: unauthenticated GET → 401 via factory; missing params → 400; valid → graph).

## Test plan

- Extend the route test to cover GET with the factory's behavior (auth + validation). Mirror the POST test pattern in `src/app/api/engine/knowledge-graph/__tests__/*`.

## Maintenance

- Both verbs now share `handleGraphFetch` and the factory's error envelope.

## Escape hatches

- If `createRouteHandler` does not support query-string params, convert the client to POST (check consumers first) instead of forcing a mismatched GET. Do not leave the GET half-migrated.
