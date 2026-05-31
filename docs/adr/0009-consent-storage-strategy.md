# ADR-09: User Consent Storage Strategy — Dual Appwrite + Dexie

**Status:** Accepted  
**Date:** 2026-05-31

## Context

Lumni handles four consent dimensions: analytics tracking, marketing communications, third-party AI data sharing, and TOS/privacy version acceptance. These consents must be:

1. **Stored server-side** — for compliance audits and cross-device sync
2. **Accessible offline** — the app is offline-first; consent gating must work without a network
3. **Queryable** — to check consent before firing Sentry, Vercel Analytics, or AI calls
4. **Auditable** — with timestamps for when consent was given or revoked

Four storage options were considered: Appwrite user `prefs` object, a dedicated Appwrite collection, Dexie IndexedDB only, or dual (Appwrite + Dexie).

## Decision

**Dual-write to Appwrite (`user_consents` collection) and Dexie IndexedDB (`userConsents` table v24).**

- **Appwrite** is the canonical source of truth. Used for server-side enforcement, cross-session persistence, and compliance auditing.
- **Dexie** is the local cache. All reads come from Dexie (offline-first). Consent is checked synchronously from Dexie before firing analytics or AI calls.
- **Write path**: `UserConsentService.save()` writes to both stores. If Appwrite write fails (offline), the Dexie write still applies and a sync job is queued.
- **Read path**: Always reads from Dexie. Appwrite is the fallback if Dexie is empty (first visit or data cleared).

Alternatives rejected:
- **Appwrite user `prefs`**: Not queryable, no audit trail, no structure. Rejected.
- **Appwrite collection only**: Breaks offline consent gating — Analytics/Sentry initialise before network resolves. Rejected.
- **Dexie only**: No server-side enforcement, lost on device clear. Rejected.

## Consequences

- **Positive**: Offline consent gating works immediately; Sentry/Vercel/AI can check consent from Dexie synchronously.
- **Negative**: Dual-write complexity; schema must stay in sync; extra Dexie table (v24 vs current v23).
- **Neutral**: Follows the existing offline-first pattern used by questions, visuals, and quiz packs.

## Related

- ADR-07 (Appwrite permission model — POPIA compliance)
- `src/lib/db/schema.ts` (Dexie schema, v24)
- `src/lib/db/client.ts` (Appwrite collection registry)
- `src/lib/services/user-consent-service.ts` (dual-write service)
