# Plan P002: Add Auth Guard to Chat Endpoint

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/app/api/chat/route.ts`
> If the file changed, compare the "Current state" excerpts against the live code.

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

The `/api/chat` endpoint is a raw `export async function POST(req)` handler with no authentication guard. It only has budget tracking (`checkBudget`). Anyone can send unlimited AI chat messages up to the daily budget limit, draining paid AI API credits (Gemini, Nvidia NIM, Groq). All other AI-costing routes use the `createRouteHandler` factory with explicit `auth` mode.

## Current state

**`src/app/api/chat/route.ts:93-205`** — the entire handler is a standalone `POST` function:

```typescript
export async function POST(req: NextRequest) {
  const budgetResult = await checkBudget(req, "generate");
  if (!budgetResult.allowed) {
    return budgetResult.response ?? new Response("Budget exceeded", { status: 429 });
  }
  const userId = budgetResult.userId;
  // ... no further auth checks ...
}
```

It uses `checkBudget` which may extract user via cookie, but there's no explicit auth requirement. Compare with every other AI-costing route like `src/app/api/engine/generate/route.ts:7` which uses `createRouteHandler({ auth: "required", ... })`.

The `chat/image/route.ts` already uses `createRouteHandler` — confirming the pattern exists in the chat namespace.

**Repo conventions**: All API routes should use `createRouteHandler()` from `@/lib/api/create-route-handler`. The factory supports `auth: "required"` (rejects unauthenticated), `auth: "optional"` (passes userId if available), and `auth: "none"`. Error responses are uniform. See `src/app/api/engine/generate/route.ts` as an exemplar pattern.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**:

- `src/app/api/chat/route.ts` — the non-streaming chat route

**Out of scope**:

- `src/app/api/chat/image/route.ts` — already uses `createRouteHandler`
- The streaming vs non-streaming logic within the handler
- Any changes to the AI provider chain or budget tracking
- Adding test files for the chat route

## Git workflow

- Branch: `advisor/P002-chat-auth`
- Commit message: `fix: add auth guard to chat endpoint via createRouteHandler`
- Do NOT push or open a PR

## Steps

### Step 1: Refactor to use `createRouteHandler`

Replace the raw `export async function POST(req: NextRequest)` handler with the factory pattern.

At the top of the file, add the import:

```typescript
import { createRouteHandler } from "@/lib/api/create-route-handler";
```

The import for `NextRequest` can remain if still needed for streaming type usage, but the handler function itself should be wrapped.

Keep the existing helper functions (`getModels`, `buildUserPrompt`, `tryStreamWithModels`) as-is. They don't need changes.

Wrap the handler logic:

```typescript
const chatHandler = createRouteHandler({
  auth: "required",
  execute: async ({ request, userId, body }) => {
    const budgetResult = await checkBudget(request as Request, "generate");
    if (!budgetResult.allowed) {
      throw new HttpError(429, "Budget exceeded");
    }

    if (!body.message?.trim()) {
      throw new HttpError(400, "Message is required");
    }

    const acceptsStream = request.headers.get("Accept") === "text/event-stream";
    const userPrompt = buildUserPrompt(body);

    const ctx = await buildChatContext().catch(() => "");
    const systemPrompt = ctx
      ? `${CHAT_SYSTEM_PROMPT}\n\n---\nStudent Context:\n${ctx}`
      : CHAT_SYSTEM_PROMPT;

    if (acceptsStream) {
      try {
        const streamResult = await runWithAICallContext({ consentGranted: true }, () =>
          tryStreamWithModels(userPrompt, systemPrompt),
        );

        const stream = streamResult.textStream.pipeThrough(
          new TransformStream({
            transform(chunk, controller) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ token: chunk })}\n\n`),
              );
            },
            flush(controller) {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            },
          }),
        );

        try {
          await trackUsage("generate", userId ?? "anonymous");
        } catch {
          /* best-effort */
        }

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch (err) {
        logError("ChatStream", err);
        const encoder = new TextEncoder();
        const errorStream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: "AI service unavailable" })}\n\n`),
            );
            controller.close();
          },
        });
        return new Response(errorStream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }
    }

    // Non-streaming fallback
    try {
      const models = getModels();
      if (models.length === 0) {
        return Response.json({ error: "No AI providers configured" }, { status: 500 });
      }

      for (const { provider, model } of models) {
        try {
          const { text } = await runWithAICallContext({ consentGranted: true }, () =>
            generateText({
              model,
              system: systemPrompt,
              prompt: userPrompt,
              temperature: 0.7,
              maxOutputTokens: 1024,
            }),
          );

          try {
            await trackUsage("generate", userId ?? "anonymous");
          } catch {
            /* best-effort */
          }

          return Response.json({ content: text });
        } catch (err) {
          logError(`ChatNonStream.${provider}`, err);
        }
      }

      return Response.json({ error: "All AI providers failed" }, { status: 500 });
    } catch (err) {
      logError("ChatNonStream", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  errorLabel: "Chat",
});

export const POST = chatHandler;
```

**Important**: The `createRouteHandler` factory wraps `execute` in a try/catch with `HttpError` handling. The factory's `auth: "required"` mode automatically rejects unauthenticated requests with a 401. The factory passes `{ request, userId, body }` — note that `request` is of type `Request`, so you may need to cast it for `checkBudget`.

### Step 2: Remove the raw `NextRequest` import if not used elsewhere

Check if `NextRequest` is still used outside the handler. If the only use was the `POST(req: NextRequest)` signature, remove the import.

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0.

## Test plan

No new tests for this plan. The change is mechanical and the factory pattern is well-tested.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] `grep -n "export async function POST" src/app/api/chat/route.ts` returns no matches (the raw handler is gone)
- [ ] `grep -n "createRouteHandler" src/app/api/chat/route.ts` returns at least one match
- [ ] No files outside `src/app/api/chat/route.ts` are modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The `createRouteHandler` factory's auth mode doesn't pass the `Request` object in a way compatible with `checkBudget`
- The `body` parameter from the factory doesn't match the expected shape
- You find the chat route is also imported/referenced elsewhere in a way that expects the raw handler signature

## Maintenance notes

- The streaming SSE response uses `new Response(stream, ...)` which is compatible with the factory's return type
- If the factory `auth: "required"` breaks anonymous chat for existing users, consider `auth: "optional"` instead — but the budget tracking already tracks anonymous users, and the original code allowed anonymous chat up to the budget limit. `auth: "required"` is the correct security posture for a paid-AI endpoint
