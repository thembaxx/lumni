# Plan 156: Create localStorage abstraction layer — migrate ~40 remaining direct accesses

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/`

## Status

- **Priority**: P2 | **Effort**: L (40+ files) | **Risk**: MEDIUM | **Depends on**: none | **Category**: arch
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

AGENTS.md Session 24 migrated onboarding, planner sessions, and study sessions from localStorage to Dexie. But ~40+ remaining files still access `localStorage` directly (for auth tokens, settings, flashcard state, editor drafts, etc.). Direct localStorage access is untestable, fragile (SSR crashes if `window` is undefined), and makes migration to cross-device sync harder.

## Current state

Run `rg "localStorage\." src/ --type ts --type tsx` to get the exact count. Expected: ~40-60 direct accesses across the codebase. These fall into categories:

1. **Auth tokens** — stored in localStorage, read on page load
2. **UI preferences** — sidebar open/close, theme preference before API loads
3. **Editor drafts** — saved on change, loaded on mount
4. **Flashcard state** — study session position, collapsed sections
5. **Miscellaneous** — onboarding skip, dismissed banners, tutorial progress

## Steps

### Step 1: Create abstraction module

Create `src/lib/shared/local-storage.ts`:

```typescript
// Thin wrappers for SSR safety and testability
export function getLocalItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

export function setLocalItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

export function removeLocalItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}
```

### Step 2: Categorize each access

Group direct accesses by category and decide migration strategy:

**Category A — Auth tokens** (e.g., `localStorage.getItem("auth_token")`):

- Create typed getters/setters in `src/lib/auth/token-storage.ts`
- One stop for all token-related storage

**Category B — UI preferences**:

- Create typed getters/setters in a `src/lib/ui/preference-storage.ts`
- Namespace keys with `lumni_pref_` prefix

**Category C — Editor drafts**:

- Create `src/lib/shared/draft-storage.ts` with auto-save/restore
- Generic `saveDraft(key, value)`, `loadDraft(key)`, `clearDraft(key)`

**Category D — Miscellaneous**:

- Create `src/lib/shared/flag-storage.ts` for boolean flags
- `getFlag(key)`, `setFlag(key)`, `clearFlag(key)`

### Step 3: Migrate each file

For each direct `localStorage` access, replace with the typed abstraction. Follow the pattern:

```typescript
// Before:
const token = localStorage.getItem("auth_token");
// After:
import { getAuthToken } from "@/lib/auth/token-storage";
const token = getAuthToken();
```

### Step 4: Migrate tests

If any test file mocks `localStorage`, update the mock to target the abstraction module instead.

### Step 5: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass. `rg "localStorage\." src/ --type ts --type tsx | wc -l` → 0 (or near-0 intentional uses).

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` passes
- [ ] `< 5` direct `localStorage` accesses remaining in src/ (intentional, with inline comment explaining why)
- [ ] Auth tokens use typed getter/setter
- [ ] UI preferences use typed getter/setter
- [ ] Editor drafts use typed auto-save/restore
- [ ] SSR-safe wrappers used everywhere

## STOP conditions

This is a large plan (40+ files). Use `rg "localStorage\." src/ --type ts --type tsx` first to get the exact count. If it's already < 10, reduce the scope to just the abstraction module + remaining migrations. If it's > 60, batch the work in 20-file chunks with typecheck after each batch.
