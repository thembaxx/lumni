# Plan 196: DBE matric results — replace demo data with real pipeline

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M (if admin tool route) / L (if DBE scraping — historically blocked)
- **Risk**: LOW (admin tool route) / MED (DBE scraping — site may change)
- **Depends on**: none
- **Category**: direction
- **Issue**: (none)

## Why this matters

The matric results page (`src/app/[locale]/matric-results/`) shows demo data with a prominent disclaimer. Students use it to check their NSC/SC results. If it's clearly fake, they lose trust. The plan has two possible paths — pick the viable one.

## Current state

- `src/lib/matric-results/index.ts` — line 1-4: `// TODO: Replace demo data with real DBE integration`
- `src/lib/matric-results/data.ts` — 80+ fake student records with `seededRandom()` + `generateScore()`
- `src/app/api/matric-results/route.ts` — returns `{ isDemoData: true, disclaimer: "Demo data — not real matric results..." }`
- DBE integration was attempted historically and failed (DBE site is image-based PDFs, no structured API)

## Scope

**In scope (Path A — Recommended)**:
- Admin data-entry tool: `POST /api/admin/matric-results/upload` — CSV/JSON upload endpoint
- Dexie v42: `matricResults` table
- Student view: `GET /api/matric-results` reads from Dexie instead of generating synthetic data
- Keep `data.ts` as fallback when no real data exists (remove the `isDemoData` flag — just show available data or empty state)

**Out of scope**:
- DBE web scraping (attempted before, site is image-based, OCR unreliable)
- Auto-fetch from DBE partner API (no known API exists)
- Real-time results checking (DBE publishes once/year per candidate)

## Steps

### Step 1: Add `matricResults` to Dexie schema (v42)

In `src/lib/db/schema.ts`:

```ts
"matricResults": "&candidateNumber, examYear, examSession, subject, &[candidateNumber+examYear]",
```

Add `MatricResult` type to `src/lib/matric-results/types.ts`:
```ts
interface MatricResult {
  candidateNumber: string;
  firstName: string;
  lastName: string;
  examYear: number;
  examSession: "may-june" | "oct-nov" | "supplementary";
  subject: string;
  subjectCode?: string;
  paperNumber?: number;
  mark: number;
  outOf: number;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  achievement: "not-achieved" | "achieved" | "outstanding" | string;
  schoolName?: string;
  centreNumber?: string;
}
```

### Step 2: Create admin upload route

Create `src/app/api/admin/matric-results/upload/route.ts`:

- Auth: admin only (`auth: "admin"`)
- Accepts `multipart/form-data` with CSV file (or JSON body)
- CSV columns: candidateNumber, firstName, lastName, examYear, session, subject, mark, outOf, level
- Validates: candidateNumber required, mark <= outOf, level 1-7
- Batch inserts into Dexie `matricResults` table
- Returns `{ inserted: number, errors: number, errorRows: string[] }`

### Step 3: Create admin upload UI

Create `src/app/[locale]/admin/matric-results/page.tsx`:

- CSV upload drag-and-drop zone (follow existing patterns from `src/components/tools/core/snap-dialog.tsx`)
- Preview table of parsed rows before commit
- Submit button with progress indicator
- Uses existing Admin layout (`src/app/[locale]/admin/`)

### Step 4: Update student-facing API

In `src/app/api/matric-results/route.ts`:

1. Remove `isDemoData` and `disclaimer` from response
2. Query `dexieDataAccess.matricResults.where("candidateNumber").equals(candidateNumber).toArray()`
3. Return array of results (empty array = no results found, show empty state)
4. Fall back to `data.ts` synthetic data only when the Dexie table is empty AND the environment is development

### Step 5: Update student-facing UI

In `src/app/[locale]/matric-results/page.tsx` and its client component:

1. Remove the `isDemoData` banner
2. Show "No results found" empty state with search-by-candidate-number form when array is empty
3. Keep the existing results display when data exists

### Step 6: Verify

```bash
pnpm typecheck
pnpm exec biome check
pnpm test
```

## Test plan

- `src/app/api/admin/matric-results/upload/__tests__/route.test.ts` — test valid CSV, malformed rows, duplicate candidate numbers, admin auth guard
- `src/lib/matric-results/__tests__/schema.test.ts` — Dexie schema migration

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] Admin can upload CSV of matric results at `/admin/matric-results`
- [ ] Student matric results page shows real data or empty state (no "demo data" disclaimer)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Dexie version is already past v42 — check `src/lib/db/schema.ts` current version and adjust
- Admin route auth guard doesn't support `"admin"` — check `createRouteHandler` auth options in `src/lib/api/create-route-handler.ts`
- CSV parsing library is not already in the project — check `package.json` for `papaparse` or similar; if absent, use the built-in `parseCsv()` from `src/app/api/teacher/roster/import/route.ts`

## Maintenance notes

- DBE publishes PDF results per centre. If a future contributor wants to automate ingestion, the CSV upload endpoint accepts the same schema. An OCR/pipeline step could feed into this route.
- The synthetic data in `data.ts` should be kept indefinitely as dev-only fallback for visual testing.
