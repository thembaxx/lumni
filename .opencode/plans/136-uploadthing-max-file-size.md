# Plan 136: Add `maxFileSize` to all UploadThing uploaders

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/app/api/uploadthing/core.ts`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: security
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

Four of six UploadThing uploaders specify `fileTypes` but omit `maxFileSize`. The `generalUploader` accepts `["image", "video", "pdf", "audio", "text"]` with no size limit — exposing the project to storage cost spikes from oversized uploads.

## Current state

`src/app/api/uploadthing/core.ts` — four uploaders missing `maxFileSize`:

- `generalUploader`: image/video/pdf/audio/text — no maxFileSize
- `subjectsUploader`: image/video — no maxFileSize
- `qaUploader`: image/video/text — no maxFileSize (has maxFileCount but not maxFileSize)
- Three uploaders already have maxFileSize: imageUploader (4MB), avatarUploader (2MB), examPapersUploader (10MB)

## Steps

### Step 1: Add maxFileSize to generalUploader

```typescript
export const generalUploader = f({
  image: { maxFileSize: "4MB" },
  video: { maxFileSize: "32MB" },
  pdf: { maxFileSize: "10MB" },
  audio: { maxFileSize: "8MB" },
  text: { maxFileSize: "1MB" },
});
```

### Step 2: Add maxFileSize to subjectsUploader

```typescript
image: { maxFileSize: "4MB" },
video: { maxFileSize: "32MB" },
```

### Step 3: Add maxFileSize to qaUploader

```typescript
image: { maxFileSize: "4MB" },
video: { maxFileSize: "32MB" },
text: { maxFileCount: 1, maxFileSize: "1MB" },
```

### Step 4: Verify

`pnpm exec oxlint` → exit 0. `pnpm exec oxfmt --check` → exit 0.

## Done criteria

- [ ] All 6 uploaders have explicit `maxFileSize` values
- [ ] The 3 uploaders that previously had `maxFileSize` retain their original values
- [ ] `pnpm exec oxlint` exits 0
