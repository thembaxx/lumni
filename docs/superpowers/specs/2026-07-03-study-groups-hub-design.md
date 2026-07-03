# Study Groups Hub — Design Spec

**Date:** 2026-07-03
**Status:** Draft
**Scope:** Groups Hub (Approach B) — surface existing study groups in the nav, add admin controls, discoverability, and a richer group detail page.

## 1. Goals

- Surface study groups in the sidebar navigation under a new "Social" category
- Upgrade the group list page to a tabbed Groups Hub (My Groups / Discover / Admin)
- Add admin controls: rename group, update description/visibility, pin posts, mute members, assign co-admins
- Add public group discovery with search/subject filter
- Keep existing peer-to-peer group model intact — no teacher/class concept yet

## 2. Data Model Changes

### Types (`src/lib/study-groups/types.ts`)

```typescript
// StudyGroup additions
visibility?: "public" | "private"       // default "private"
pinnedPostIds?: string[]                // post IDs pinned to top

// GroupMember additions
isMuted?: boolean

// New
export interface UpdateGroupInput {
  name?: string;
  description?: string;
  subjectId?: string;
  visibility?: "public" | "private";
}
```

No Dexie or Appwrite schema migration needed — fields are optional and Appwrite documents are schemaless.

## 3. Service Layer

New functions in `src/lib/study-groups/service/`:

| Function                                        | Description                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `updateGroup(userId, groupId, input)`           | Rename, change description/visibility/subject (admin/co-admin only) |
| `pinPost(userId, groupId, postId)`              | Pin post to top of feed (admin/co-admin only)                       |
| `unpinPost(userId, groupId, postId)`            | Unpin post (admin/co-admin only)                                    |
| `muteMember(userId, groupId, memberId)`         | Mute member — prevents posting/commenting (admin only)              |
| `unmuteMember(userId, groupId, memberId)`       | Unmute member (admin only)                                          |
| `assignCoAdmin(adminUserId, groupId, memberId)` | Promote member to co-admin (creator only)                           |
| `removeCoAdmin(adminUserId, groupId, memberId)` | Demote co-admin back to member (creator only)                       |
| `discoverGroups(subjectId?, search?)`           | List public groups with optional subject/search filter              |

### Updated existing functions

- `deletePost()` — now allows admin/co-admin to delete any post in the group (not just their own)
- `removeMember()` — allow co-admins to remove members (but not delete group)
- `createPost()` — reject if user is muted

## 4. API Routes

New routes under `src/app/api/study-groups/`:

| Method | Path                                     | Action                                            |
| ------ | ---------------------------------------- | ------------------------------------------------- |
| PATCH  | `/[groupId]`                             | Update group settings                             |
| POST   | `/[groupId]/pin`                         | Pin a post                                        |
| DELETE | `/[groupId]/pin`                         | Unpin a post                                      |
| POST   | `/[groupId]/members/[memberId]/mute`     | Mute member                                       |
| DELETE | `/[groupId]/members/[memberId]/mute`     | Unmute member                                     |
| POST   | `/[groupId]/members/[memberId]/co-admin` | Assign co-admin                                   |
| DELETE | `/[groupId]/members/[memberId]/co-admin` | Remove co-admin                                   |
| GET    | `/discover`                              | List public groups (query: `subjectId`, `search`) |

## 5. Hooks

New hooks in `src/hooks/use-study-groups.ts`:

| Hook                | Operation                 |
| ------------------- | ------------------------- |
| `useUpdateGroup`    | PATCH group settings      |
| `usePinPost`        | POST pin                  |
| `useUnpinPost`      | DELETE pin                |
| `useMuteMember`     | POST mute                 |
| `useUnmuteMember`   | DELETE mute               |
| `useAssignCoAdmin`  | POST co-admin             |
| `useRemoveCoAdmin`  | DELETE co-admin           |
| `useDiscoverGroups` | GET discover (query hook) |

All mutations invalidate the relevant `["study-group", groupId]` and `["group-posts", groupId]` keys.

## 6. UI Components

### New components

| Component             | File                                                    | Description                                                                    |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `GroupsHub`           | `src/components/study-groups/groups-hub.tsx`            | Tabbed hub (My Groups / Discover / Admin), orchestrates sub-components         |
| `DiscoverGroups`      | `src/components/study-groups/discover-groups.tsx`       | Searchable grid of public groups with subject filter                           |
| `GroupSettingsDialog` | `src/components/study-groups/group-settings-dialog.tsx` | Inline dialog for name/description/visibility edits                            |
| `GroupAdminPanel`     | `src/components/study-groups/group-admin-panel.tsx`     | Admin-only section in group detail (delete group, manage co-admins, mute list) |

### Updated components

- **`study-groups-list.tsx`** → replaced by `GroupsHub` (same route, new contents)
- **`group-detail.tsx`** — adds: edit button on info card, pin toggle on posts, mute UI on members, co-admin buttons, admin settings panel
- **`post-card.tsx`** — accepts `onPin`/`onUnpin` props, shows pin indicator
- **`study-group-card.tsx`** — shows visibility badge ("Public" / "Private")

### States per component

| Component             | Loading                           | Empty                                 | Error                  | Edge                                         |
| --------------------- | --------------------------------- | ------------------------------------- | ---------------------- | -------------------------------------------- |
| GroupsHub (My Groups) | 3-card skeleton grid              | "No groups yet" + create/join CTAs    | Toast on fetch fail    | —                                            |
| GroupsHub (Discover)  | 3-card skeleton grid              | "No public groups found" + create CTA | Toast on fetch fail    | Search yields no matches → "No groups match" |
| GroupsHub (Admin)     | —                                 | Hidden if user not admin of any group | Toast on action fail   | Group selector dropdown required first       |
| GroupSettingsDialog   | Save button disabled while saving | —                                     | Toast on save fail     | "Save" disabled until a field changes        |
| GroupAdminPanel       | —                                 | "No members to manage"                | Toast on action fail   | Delete group requires typed confirmation     |
| Group detail posts    | Existing skeleton                 | Existing empty feed                   | Toast on pin/mute fail | Muted members see lock icon                  |

## 7. Sidebar Navigation

Add to `src/lib/navigation/config.ts`:

```typescript
{
  label: "Social",
  items: [
    {
      id: "study-groups",
      label: "Study Groups",
      icon: UserGroupIcon,
      route: "/study-groups",
    },
  ],
},
```

Inserted between "Tools" (index 2) and "Progress" (index 3). Also add `/study-groups` to `getNavHierarchy()`.

## 8. Error Handling

- All service functions return `ServiceResult<T>` — existing pattern
- All mutations show toast on error via existing `useToast` pattern
- Muted member attempting to post resolves to a 403 with "You are muted in this group" message
- Non-admin attempting admin actions resolves to 403
- Deleting a group cascades: deletes members, posts, comments, reactions, invites, live sessions

## 9. Testing

- Unit tests for new service functions (muted user posting, co-admin permissions, visibility filtering)
- Existing hook factory pattern already tested — new hooks follow the same pattern
- Component tests for: GroupsHub tab switching, Discover search, mute lock icon, pin toggle visibility

## 10. Scope Boundaries (out of scope)

- Teacher-led classes with rosters — deferred to future phase
- Push notifications for group activity
- Group activity feed (timeline of member actions)
- File/image sharing in posts
- Group search by name (only by subject filter)
