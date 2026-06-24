# Advisor Plan 005: Fix empty JSON catch swallowing malformed requests in API route

> **Source**: Audit finding SEC-02
> **Priority**: P2
> **Effort**: S (minutes)
> **Risk**: LOW
> **Confidence**: HIGH

## Why this matters

In `src/app/api/exam-dates/route.ts:35`, the handler silently swallows JSON parse errors:

```typescript
const body = (await req.json().catch(() => ({}))) as { slots?: ExamSlot[] };
```

Malformed requests (e.g., `Content-Type: application/json` with invalid JSON body) silently become empty objects `{}`, bypassing any downstream validation. The route's Zod schema then validates `{}`, which may pass partial validation and cause confusing downstream logic errors.

This is a security concern because:

- Errors during request parsing should be surfaced, not hidden
- Downstream code processes an empty body as if the request was valid
- Consistent with the broader CORR-01 fix, but deserves its own focused plan due to the security angle

## Fix

Replace the silent `.catch()` with one that logs the error and re-throws:

```typescript
const body = (await req.json().catch((e) => {
  logError("examDates.parseBody", e);
  throw new Error("Invalid JSON in request body");
})) as { slots?: ExamSlot[] };
```

Or, if the route needs to handle non-JSON bodies gracefully, log and return a 400 response:

```typescript
let body: { slots?: ExamSlot[] };
try {
  body = await req.json();
} catch (e) {
  logError("examDates.parseBody", e);
  return Response.json({ error: "Invalid JSON" }, { status: 400 });
}
```

## Steps

1. Open `src/app/api/exam-dates/route.ts`
2. Replace the empty `.catch(() => ({}))` with one of the two fix options above
3. Ensure `logError` is imported from `@/lib/shared/logger`
4. `pnpm run typecheck` → exit 0
5. `pnpm run test` → all pass

## Done criteria

- [ ] `exam-dates/route.ts` no longer swallows JSON parse errors
- [ ] Errors are logged via `logError()`
- [ ] The route returns appropriate error response on malformed JSON
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
