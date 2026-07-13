---
status: TODO
priority: P2
effort: S
risk: LOW
confidence: MED
created: 2026-07-12
commit: 4fcd46a4
---

# 171 — Webhook endpoint URLs: no host allowlist

## Context

Webhook endpoints are registered via `POST /api/webhooks/endpoints` which validates the URL only with `z.string().url()`. `http://169.254.169.254/...` or `http://localhost/...` pass. If the dispatcher is ever wired to a server-side registry, this becomes a real SSRF. Today dispatch runs in the browser (reads endpoints from client Dexie), limiting exploitability — but the validation gap is real and cheap to close.

## Current state (verified)

`src/app/api/webhooks/endpoints/route.ts:6-10`

```ts
const endpointSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  description: z.string().optional(),
});
```

`src/lib/webhooks/dispatcher.ts:39` — `fetch(url, ...)` with no scheme/host restriction.

## Goal

Reject non-HTTPS and private/loopback/link-local hosts at registration time.

## Steps

1. In `src/app/api/webhooks/endpoints/route.ts`, replace `url: z.string().url()` with a `.refine()` (or `.superRefine`) that:
   - parses with `new URL(url)`,
   - requires `protocol === "https:"`,
   - blocks `hostname` in `localhost`, `127.0.0.0/8`, `169.254.0.0/16` (link-local/metadata), `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`, and `0.0.0.0`.
2. Apply the same guard wherever endpoints are created in the registry (`src/lib/webhooks/*` — search `createEndpoint`), so the rule lives in one place (prefer a shared `isValidWebhookUrl` helper imported by both the route and the registry).
3. Keep `dispatcher.ts` as-is (defense in depth is now at registration).
4. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/app/api/webhooks/endpoints/route.ts`, `src/lib/webhooks/*` (registry/validation).
- Out of scope: dispatcher retry/backoff logic, the client-side Dexie dispatch path.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/lib/webhooks src/app/api/webhooks` → pass (add a test: `http://169.254.169.254/x` rejected, `https://hooks.example.com` accepted).

## Test plan

- Add/extend `src/lib/webhooks/__tests__/*` or route test: assert validation rejects `http://`, `http://localhost`, `http://169.254.169.254/latest/meta-data/`, and accepts a normal `https://` host. Mirror existing webhook test mocking.

## Maintenance

- If a legit internal webhook host is ever needed (e.g. a self-hosted instance), add it to an explicit allowlist env var rather than relaxing the blocklist.

## Escape hatches

- Do NOT silently downgrade to `http` allowance. If the product requires non-HTTPS endpoints, that is a product decision — STOP and report.
