# Plan 070: Fix note storage crash + unify three fragmented note-storage paths

> **Executor instructions**: Follow this plan step by step. Run every verification command — do not move on until it passes. If anything in STOP conditions occurs, stop and report.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug / tech-debt
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

Notes are read from three different storage locations depending on the code path:

1. `localStorage.getItem("lumni-notes")` in `search-service.ts`
2. `localStorage.getItem("lumni_notes")` in `study-set-editor.tsx` (underscore vs hyphen)
3. `notes` Dexie table in the note-editor component

A user who adds notes through the editor (Dexie) won't see them in search or the study-set picker (both read localStorage). Additionally, `JSON.parse()` in `useState` (at `use-note-storage.ts:18` and `:28`) will crash if localStorage contains malformed JSON. Session 24 (June 2026) migrated some localStorage data to Dexie but notes were missed.

## Current state

`src/hooks/use-note-storage.ts:18,28`:

```typescript
const [notes, setNotes] = useState<Note[]>(() => {
  const raw = localStorage.getItem("lumni_notes");
  return raw ? JSON.parse(raw) : []; // crashes on malformed JSON
});
```

Two localStorage keys exist:

- `"lumni-notes"` (hyphen) — used in `search-service.ts:324-325`
- `"lumni_notes" (underscore) — used in `use-note-storage.ts`and`study-set-editor.tsx:82`

Dexie has a `notes` table (added Session 24, version 31).

## Scope

**In scope**:

- `src/hooks/use-note-storage.ts` — wrap `JSON.parse` in try/catch; migrate to Dexie
- `src/lib/services/search-service.ts` — reads from Dexie not localStorage
- `src/components/tools/study-sets/study-set-editor.tsx` — reads from Dexie not localStorage
- Dexie schema if `notes` table needs indexes

**Out of scope**:

- Backfilling existing localStorage notes into Dexie — handled by Step 1 migration
- Other localStorage reads beyond notes
- The `notes` component UI

## Steps

### Step 1: Fix crash in `use-note-storage.ts`

Wrap both `JSON.parse` calls in try/catch:

```typescript
const raw = localStorage.getItem("lumni_notes");
let parsed: Note[] = [];
try {
  parsed = raw ? JSON.parse(raw) : [];
} catch {
  parsed = [];
}
```

Also change the `useState` initializer to handle the malformed-JSON case gracefully using `tryParse`:

```typescript
function tryParse<T>(raw: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}
```

### Step 2: Migrate `search-service.ts` to read from Dexie

In `src/lib/services/search-service.ts:324-325`, replace:

```typescript
const raw = localStorage.getItem("lumni-notes");
const notes: Note[] = raw ? JSON.parse(raw) : [];
```

With:

```typescript
const notes = await db.notes.toArray();
```

This requires the `notes` table to be migrated to DataAccess (which it already was in Session 24). Verify with `import { dataAccess } from "@/lib/db"` or read the file to see which DataAccess instance is used.

### Step 3: Migrate `study-set-editor.tsx` to read from Dexie

In `src/components/tools/study-sets/study-set-editor.tsx:82`, replace the localStorage read:

```typescript
const notes: Note[] = JSON.parse(localStorage.getItem("lumni_notes") || "[]");
```

With a Dexie read. The component likely uses a hook (`useNoteStorage` or similar). The cleanest fix is to modify `useNoteStorage` to read from Dexie and have all three consumers use it.

### Step 4: Migrate `use-note-storage.ts` to Dexie (full migration)

The full migration converts `useNoteStorage` from localStorage to Dexie:

```typescript
// Before:
const [notes, setNotes] = useState<Note[]>(() => { ... localStorage ... });

// After:
useEffect(() => {
  db.notes.toArray().then(setNotes);
}, []);
// setNotes also writes to Dexie
```

If the `useNoteStorage` hook has add/update/delete functions, update those to use Dexie operations as well.

### Step 5: Remove the localStorage migration bridge

After all consumers are reading from Dexie, remove the localStorage read in `use-note-storage.ts` entirely. The hook becomes a Dexie-only hook.

### Step 6: Verify

**Verify**:

- `pnpm run test` → all pass (especially search-related tests)
- `pnpm run typecheck` → exit 0
- `pnpm exec oxlint --fix` → exit 0
- Manually: add a note in the editor → it appears in search results

## Done criteria

- [ ] Malformed localStorage JSON in notes no longer crashes the editor (try/catch in place)
- [ ] All three consumers read from the same Dexie `notes` table (or via the same hook)
- [ ] `"lumni-notes"` and `"lumni_notes"` localStorage keys are no longer read by any consumer
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] No files outside in-scope list are modified

## STOP conditions

- If Dexie's `notes` table doesn't exist (Session 24 migration stalled) — stop and report. You'll need to add the table to the Dexie schema, which is a bigger change involving a version bump.
- If the `useNoteStorage` hook has many consumers beyond the three listed — grep for `useNoteStorage` imports and ensure all consumers are covered.
