---
status: TODO
priority: P1
effort: S
risk: LOW
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 166 — SSRF in `getExamMarkdown` server action

## Context

`getExamMarkdown` is a `"use server"` function that fetches a URL derived from a **client-supplied** `fileUrl` (replacing `.pdf` with `.md`) and returns the fetched content to the caller. Because it only checks `auth()` (logged-in), **any authenticated user** can make the server fetch an arbitrary URL (including cloud metadata `http://169.254.169.254/...` or internal services) and read the response body back. This is a server-side request forgery.

## Current state (verified)

`src/lib/server/exam-markdown.ts:50-105`

```ts
export async function getExamMarkdown(fileUrl: string): Promise<GetExamMarkdownResult> {
  const userId = await auth();
  if (!userId) { ... }
  if (!fileUrl) { ... }
  const markdownUrl = fileUrl.replace(/\.pdf$/i, ".md");
  try {
    const markdownResponse = await fetch(markdownUrl, { method: "HEAD" }); // no host allowlist
    ...
```

Caller `src/app/[locale]/past-papers/[id]/past-paper-client.tsx` passes `exam?.fileUrl`; but a client can invoke the server action directly with any string.

## Goal

Restrict fetches to the trusted uploadthing host (and the two conversion providers, which are fixed/known hosts), rejecting any other URL.

## Steps

1. Read `src/lib/server/exam-markdown.ts` and identify the legitimate host(s). The `.md` URL comes from uploadthing; derive the allowed host from `process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT`? No — it is the uploadthing host. Check where `exam.fileUrl` is generated (search `fileUrl` in exam upload flow) to confirm the expected hostname (e.g. `utfs.io` / `*.uploadthing.com`).
2. Add a strict allowlist check at the top of `getExamMarkdown` (before any `fetch`):
   ```ts
   function isAllowedMarkdownUrl(url: string): boolean {
     try {
       const u = new URL(url);
       if (u.protocol !== "https:") return false;
       return ALLOWED_MARKDOWN_HOSTS.includes(u.hostname);
     } catch {
       return false;
     }
   }
   ```
   where `ALLOWED_MARKDOWN_HOSTS` includes only the uploadthing host for the `.md` swap.
3. For the conversion fallbacks (`convertWithFirecrawl` already hits a fixed `https://api.firecrawl.dev`, `markdown.new` is a fixed host) — those are constant, so they are safe; only the **client-influenced** `markdownUrl`/`fileUrl` needs the allowlist. Apply the same `isAllowedMarkdownUrl` guard to `fileUrl` before passing to Firecrawl's `convertWithFirecrawl` and to `markdown.new`.
4. Return `{ content: "", source: "error", error: "Untrusted URL" }` when the URL is not allowed.
5. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/lib/server/exam-markdown.ts`.
- Out of scope: the caller component (it should keep passing `exam.fileUrl`; the guard is server-side), other server actions.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/lib/server` → pass (add a test, below).

## Test plan

- Add `src/lib/server/__tests__/exam-markdown.test.ts` (happy-dom + `fake-indexeddb` not needed; mock `fetch` and `auth`). Assert:
  - `getExamMarkdown("https://evil.example.com/x.md")` → `source: "error"`, no `fetch` to that host.
  - `getExamMarkdown("<valid uploadthing .md url>")` → proceeds to fetch (mock resolves).
  - `getExamMarkdown("http://169.254.169.254/latest/meta-data/")` → rejected.
    Mirror existing server-action test mocking conventions in `src/lib/server/__tests__/*`.

## Maintenance

- If the uploadthing host changes (env-driven), derive the allowed host from the same env var used to build `exam.fileUrl`, not a hardcoded string.

## Escape hatches

- If you cannot determine the canonical uploadthing host from the codebase, STOP and report; do not hardcode a guess. The guard MUST match the real `fileUrl` origin or it will break legitimate past-paper rendering.
