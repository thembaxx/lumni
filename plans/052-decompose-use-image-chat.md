# Plan 052: Decompose use-image-chat.ts (383 lines, 2 hooks, duplicated retry)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first: `git diff --stat 7525d6ed..HEAD -- src/hooks/use-image-chat.ts`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

`use-image-chat.ts` is 383 lines containing two complete hook implementations (`useImageChat` and `useImageChatWithSend`), inline type definitions, and a nested `readFileAsDataURL` helper. The `retryLastImage` callback (line 329+) duplicates the full `/api/chat/image` POST logic from `sendImage` (line 248). At 383 lines, it exceeds the decomposition thresholds applied to other files in Sessions 15/39.

## Current state

File: `src/hooks/use-image-chat.ts` (444 lines — note: the full file is 444, not 383 as estimated in the audit; verify actual length).

Contains:

- Lines 1-34: Types (`ImageProcessingStatus`, `ImageProcessingState`, `ImageData`, `UseImageChatOptions`)
- Lines 37-230: `useImageChat` hook implementation
- Lines 232-326: `useImageChatWithSend` hook implementation
- Lines 329-434: `retryLastImage` — duplicates `sendImage` POST call

The repo splits large hooks into co-located directories (see `src/hooks/image-chat/` would follow the pattern of `src/hooks/*/`).

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- Create `src/hooks/image-chat/` directory with: `types.ts`, `api.ts`, `use-image-chat.ts`, `use-image-chat-with-send.ts`
- Keep `src/hooks/use-image-chat.ts` as backward-compat barrel

**Out of scope**:

- Any consumer of the hooks (import paths should stay the same via barrel)
- Changes to hook logic beyond deduplication

## Steps

### Step 1: Create types.ts

Extract all type definitions (`ImageProcessingStatus`, `ImageProcessingState`, `ImageData`, `UseImageChatOptions`, `RetryableMessage`) into `src/hooks/image-chat/types.ts`.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Create api.ts

Extract the shared API call that both `sendImage` and `retryLastImage` duplicate:

```typescript
import { logError } from "@/lib/shared/logger";

export async function postImageToChat(
  imageUrl: string,
  chatHistory: ChatMessage[],
): Promise<{ response: string; sources: WebSource[] }> {
  const res = await fetch("/api/chat/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl, history: chatHistory }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Image analysis failed");
  }
  return res.json();
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Rewrite two hooks as separate files

In `src/hooks/image-chat/use-image-chat.ts` — the first hook, importing types and api.
In `src/hooks/image-chat/use-image-chat-with-send.ts` — the second hook, importing from the same modules.

Both hooks call `postImageToChat()` from `./api.ts` instead of inlining `fetch("/api/chat/image", ...)`.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Create backward-compat barrel

Replace the contents of `src/hooks/use-image-chat.ts` with:

```typescript
export { useImageChat } from "./image-chat/use-image-chat";
export { useImageChatWithSend } from "./image-chat/use-image-chat-with-send";
export type { ImageProcessingStatus, ImageProcessingState, ImageData } from "./image-chat/types";
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 5: Verify consumers

```bash
pnpm exec grep -rn "from.*use-image-chat" src/ --include="*.ts" --include="*.tsx"
```

Each consumer should still resolve the imports via the barrel.

**Verify**: `pnpm run test` → all pass.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `src/hooks/image-chat/` directory exists with 4 files (types.ts, api.ts, use-image-chat.ts, use-image-chat-with-send.ts)
- [ ] `src/hooks/use-image-chat.ts` is a barrel (<10 lines)
- [ ] The duplicated `fetch("/api/chat/image")` POST logic appears in exactly 1 place (`api.ts`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- A consumer imports from `src/hooks/image-chat/use-image-chat` directly (they shouldn't — use the barrel)
- `postImageToChat` has a different response shape than what `retryLastImage` expects — read both callers carefully
