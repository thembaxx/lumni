# SENTINEL'S JOURNAL

## 2026-04-21 - IDOR in `/api/subjects` due to missing auth on query param

**Vulnerability:** Insecure Direct Object Reference (IDOR) - The `/api/subjects` route accepted `userId` as a query parameter and returned all user data (subjects, progress, sessions, streak) with NO authentication check. Any unauthenticated attacker could harvest any user's study data by simply passing their userId.

**Learning:** The original code trusted user-controlled `userId` from `searchParams` without verifying the caller was authenticated or authorized. The pattern `userId = searchParams.get("userId")` followed by direct DB queries is a classic IDOR pattern — it relies on client-side userId without server-side ownership verification.

**Prevention:** Always verify session ownership server-side. Use `auth.api.getSession()` to get the authenticated session, then enforce `targetUserId === authenticatedUserId` before returning any user-specific data. Never trust client-supplied userId for accessing private data. Pattern:
1. Get session from auth system (`auth.api.getSession({ headers })`)
2. If no session → deny or return public data only
3. If userId param provided → verify it matches authenticated session's userId
4. Otherwise → use authenticated session's userId as the default target