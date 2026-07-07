# Plan 140: Fix PdfCache blob URL leak (clearOld + getUrl)

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/lib/db/repositories/pdf-cache.ts`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: bug
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

`PdfCacheRepository.clearOld()` calls `URL.revokeObjectURL(entry.paperId)` where `paperId` is a document ID string like `"paper-123"`, not a blob URL — making `clearOld()` a complete no-op. Additionally, `getUrl()` creates a new blob URL on every call but never stores or revokes it, causing cumulative blob URL memory leaks proportional to PDFs viewed per session.

## Current state

`src/lib/db/repositories/pdf-cache.ts:38-51`:

```typescript
async getUrl(paperId: string): Promise<string | null> {
  const entry = await this.get(paperId);
  if (!entry) return null;
  return URL.createObjectURL(entry.pdfData);  // New blob URL every call, never stored
}

async clearOld(maxAgeHours = 168): Promise<void> {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const old = await this.db.cachedPdfs.where("cachedAt").below(cutoff).toArray();
  for (const entry of old) {
    URL.revokeObjectURL(entry.paperId);  // BUG: paperId is "paper-123", not a blob URL
  }
  await this.db.cachedPdfs.where("cachedAt").below(cutoff).delete();
}
```

## Steps

### Step 1: Track blob URLs in a Map

Add a `Map<string, string>` to the class to track `paperId → blobUrl`:

```typescript
export class PdfCacheRepository {
  constructor(private db: DataAccess) {}
  private blobUrlMap = new Map<string, string>();
```

### Step 2: Fix getUrl to use the map

```typescript
async getUrl(paperId: string): Promise<string | null> {
  const existing = this.blobUrlMap.get(paperId);
  if (existing) return existing;

  const entry = await this.get(paperId);
  if (!entry) return null;

  const blobUrl = URL.createObjectURL(entry.pdfData);
  this.blobUrlMap.set(paperId, blobUrl);
  return blobUrl;
}
```

### Step 3: Fix clearOld to revoke from map

```typescript
async clearOld(maxAgeHours = 168): Promise<void> {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const old = await this.db.cachedPdfs.where("cachedAt").below(cutoff).toArray();
  for (const entry of old) {
    const blobUrl = this.blobUrlMap.get(entry.paperId ?? "");
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      this.blobUrlMap.delete(entry.paperId ?? "");
    }
  }
  await this.db.cachedPdfs.where("cachedAt").below(cutoff).delete();
}
```

### Step 4: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass. `pnpm exec oxlint` → exit 0.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] `clearOld()` revokes actual blob URLs, not document IDs
- [ ] `getUrl()` caches blob URLs and returns the same URL for the same paperId
