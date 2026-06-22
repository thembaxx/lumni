# Study Groups v2 — Comments + Reactions

**Status:** Approved for implementation

## Scope

Add threaded comments and emoji reactions to study group discussion posts.

## Data Model

### Appwrite Collections

**`group_comments`:**
| Field | Type | Notes |
|-------|------|-------|
| `postId` | string | Parent post |
| `userId` | string | Author |
| `userName` | string | Denormalized for display |
| `content` | string | Comment text |
| `parentId` | string? | null = top-level, else reply to comment |
| `createdAt` | string | ISO date |
| `updatedAt` | string | ISO date |

**`group_reactions`:**
| Field | Type | Notes |
|-------|------|-------|
| `postId` | string? | If reacting to a post |
| `commentId` | string? | If reacting to a comment |
| `userId` | string | Reactor |
| `emoji` | string | e.g. "👍", "❤️", "😂", "🎉", "💡" |
| `createdAt` | string | ISO date |

Constraint: exactly one of `postId` or `commentId`. Unique index on `[postId/commentId, userId, emoji]`.

### Dexie Tables (v19)

- `groupComments` — `{ id, postId, parentId, userId, userName, content, createdAt }` indexed by `postId`
- `groupReactions` — `{ id, postId, commentId, userId, emoji }` indexed by `postId`, `commentId`

## API Routes

| Method | Route                                                  | Handler                                                       |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------- |
| GET    | `/api/study-groups/[groupId]/posts/[postId]/comments`  | `listComments(postId)`                                        |
| POST   | `/api/study-groups/[groupId]/posts/[postId]/comments`  | `createComment(postId, userId, userName, content, parentId?)` |
| DELETE | `/api/study-groups/comments/[commentId]`               | `deleteComment(commentId, userId)`                            |
| POST   | `/api/study-groups/[groupId]/posts/[postId]/reactions` | `togglePostReaction(postId, userId, emoji)`                   |
| POST   | `/api/study-groups/comments/[commentId]/reactions`     | `toggleCommentReaction(commentId, userId, emoji)`             |

All routes require auth (userId from session).

## React Hooks

```typescript
useGroupComments(postId) → { comments, isLoading, createComment, deleteComment }
useGroupReactions(postId) → { reactions, isLoading, toggleReaction }
useCommentReactions(commentId) → { reactions, isLoading, toggleReaction }
```

All mutations use React Query with optimistic updates + rollback on error.

## UI Components

- **CommentThread** — recursive: renders top-level comments, each can expand nested replies with indent guides
- **CommentForm** — textarea + submit; shows "Replying to @name" indicator when replying
- **CommentCard** — avatar, userName, relative timestamp, content, reply/delete buttons, reaction row
- **ReactionBar** — horizontal row of 5 preset emojis with counts; toggles on click; "+" button opens picker
- **PostReactions** — reaction bar beneath `PostCard`
- **CommentCount** — badge on `PostCard` footer

## Data Flow

1. **Comments fetch**: `GET comments` on post mount → cache in Dexie → render threaded tree
2. **Create comment**: optimistic insert → `POST` → update Dexie → rollback on error
3. **Delete comment**: optimistic remove → `DELETE` → update Dexie → rollback
4. **Toggle reaction**: optimistic toggle → `POST` → update Dexie → rollback

## Files Changed

**New (11 files):**

- `src/app/api/study-groups/[groupId]/posts/[postId]/comments/route.ts`
- `src/app/api/study-groups/comments/[commentId]/route.ts`
- `src/app/api/study-groups/[groupId]/posts/[postId]/reactions/route.ts`
- `src/app/api/study-groups/comments/[commentId]/reactions/route.ts`
- `src/hooks/use-group-comments.ts`
- `src/hooks/use-group-reactions.ts`
- `src/components/study-groups/comment-thread.tsx`
- `src/components/study-groups/comment-form.tsx`
- `src/components/study-groups/comment-card.tsx`
- `src/components/study-groups/reaction-bar.tsx`
- `src/components/study-groups/post-reactions.tsx`

**Modified (4 files):**

- `src/lib/study-groups/service.ts`
- `src/lib/db/schema.ts`
- `src/components/study-groups/post-card.tsx`
- `src/components/study-groups/discussion-feed.tsx`

## Out of Scope

- Real-time WebSocket updates (use React Query polling/refetch instead)
- @mentions or rich text in comments
- Comment editing (delete-only for v2)
- Notification for replies (future v3)
- Reaction picker emoji set (5 preset for v2)
