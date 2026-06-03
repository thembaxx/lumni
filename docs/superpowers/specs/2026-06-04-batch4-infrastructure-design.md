# Batch 4 — Infrastructure Design

## 4.2 DAST Security Scan

### Problem
No dynamic application security testing in CI. Vulnerabilities may go undetected.

### Solution
Add a **bearer-auth DAST scan** step to the CI workflow using OWASP ZAP's baseline scan.

### Design
- New CI job `dast-scan` in `.github/workflows/ci.yml`
- Runs after the build job completes
- Uses `zaproxy/action-baseline@v0` action
- Targets `http://localhost:3000` against the built app
- Scans: common web vulnerabilities (XSS, SQL injection, CSRF, etc.)
- `fail_count: 1` — fails CI if 1+ high-risk alerts found
- Warnings only for medium/low risk
- ZAP report uploaded as CI artifact

### Pre-requisites
- App must be running on port 3000 during scan (use the existing `webServer` pattern from Playwright config)
- Set `ZAP_API_KEY` as a repo secret (or use default for baseline scan)

### Files
- Modify: `.github/workflows/ci.yml` — add `dast-scan` job

---

## 4.3 Split CI Lanes

### Problem
Current CI runs all checks in sequence. Unit tests run first, then lint, then typecheck, then build. Splitting into parallel lanes cuts total CI time.

### Solution
Restructure CI into 3 parallel job groups with coverage gates.

### Job Groups

**Group 1 — Quality** (fast, gate for everything else)
- `npx biome check`
- `npx tsc --noEmit`
- `bun run deadcode`
- Expected: <30s

**Group 2 — Unit Tests** (medium)
- `bun test --coverage` (unit + integration, excluding e2e)
- Coverage gate: minimum 70% line coverage (configurable)
- Coverage report uploaded as artifact

**Group 3 — E2E + DAST** (slow)
- `npx playwright test`
- ZAP baseline scan
- Only runs if Group 1 passes

### Dependencies
```
ci.yml:
  - quality (parallel)
  - unit-tests (parallel, needs quality)
  - build (parallel, needs quality)
  - e2e-dast (needs build)
```

### Files
- Modify: `.github/workflows/ci.yml` — restructure into groups with `needs` dependencies

---

## Appwrite SA Region Verification

### Console-side steps
1. Log into [cloud.appwrite.io](https://cloud.appwrite.io)
2. Select the `lumni` project
3. Verify project region is set to **Johannesburg, South Africa** (`jnb`)
4. Test auth flow: sign in/sign up works from SA region
5. Test database read/write: collections accessible
6. If region is incorrect, create a new project in SA region and update `NEXT_PUBLIC_APPWRITE_PROJECT_ID`

### Code-side verification
- All 26 references already point to `https://jnb.cloud.appwrite.io/v1`
- Update `src/lib/db/ensure-schema.ts` to run a connectivity check on startup
- Log `[Appwrite] Connected to SA region (jnb.cloud.appwrite.io)` on success

### Files
- Modify: `src/lib/db/ensure-schema.ts` — add region verification log
- Manual: console verification

---

## shadcn Form FieldGroup Pattern

### Problem
~25+ form locations use raw `<Label>` + `<Input>` pairs without the shadcn `FieldGroup`/`Field`/`FieldLabel` composition pattern. Forms also lack proper validation attributes (`aria-invalid`, `data-invalid`).

### Migration Steps
1. Create `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `InputGroup`, `InputGroupAddon` shadcn components if not already present
2. Migrate all form locations to use the composition pattern
3. Add `aria-invalid` + `data-invalid` to form controls that have validation
4. ToggleGroup for option sets (2-7 choices)

### High-priority forms to migrate
- `add-session-modal.tsx`, `add-exam-modal.tsx` (study planner)
- `profile-tab-refactored.tsx`, `editable-field.tsx` (settings)
- `flashcard-form.tsx`, `note-form.tsx`, `study-set-editor.tsx` (tools)
- `create-group-dialog.tsx`, `join-group-dialog.tsx`, `parent-invitation-dialog.tsx` (groups)
- `admin-subject-form.tsx` (admin)
- Auth pages: `sign-in/page.tsx`, `sign-up/page.tsx`, `reset-password/page.tsx`
- `notifications-client.tsx`, `privacy-tab.tsx`, `cookie-banner.tsx` (settings)

### Files
- New: `src/components/ui/field.tsx` — FieldGroup, Field, FieldLabel, FieldDescription, FieldError (check if shadcn CLI can add these)
- New: `src/components/ui/input-group.tsx` — InputGroup, InputGroupAddon (if needed)
- Modify: ~25 form files listed above

## Verification
- `npx tsc --noEmit` — zero errors
- `npx biome check` — zero errors
- Existing tests pass
