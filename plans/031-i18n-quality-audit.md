# Plan 031: i18n quality audit + fixes

## Status: Done

## Problem

8 of 11 SA language files (xh, st, tn, nso, ts, ss, ve, nd) were AI-generated with ~718 keys each + 64 keys added in Plan 022. AI translations can have: inconsistent terminology, unnatural phrasing, wrong register, missing placeholders, truncated strings.

## Scope

- `messages/{xh,st,tn,nso,ts,ss,ve,nd}.json` — audit and fix quality issues
- Script: check for common problems programmatically

## Approach

1. Read all 8 files and check for:
   - Missing interpolation variables (e.g., `{name}`, `{count}`) compared to en.json
   - Truncated/empty values
   - Mismatched quotes or escaped characters
   - Placeholder consistency
2. For each issue found, generate a corrected translation
3. Verify: `npx tsc --noEmit`, `npx biome check`, `bun run test`

## Done criteria

- No missing interpolation variables in any locale
- No truncated or empty values
- Placeholders match en.json exactly
- All 8 files parse as valid JSON with 782 keys each
