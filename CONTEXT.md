# Lumni

SA Matric exam prep platform — mobile-first, offline-capable, with anonymous-to-authenticated user progression and AI-generated questions/visuals.

## Language

**Anonymous User**:
A user who has not yet signed up. They have an Appwrite anonymous session and their data lives in Dexie (IndexedDB) + Appwrite (anonymous user context). On sign-up, their anonymous account is upgraded to a full email/password account and data is synced.
_Avoid_: Guest, visitor, unregistered user

**Authenticated User**:
A user who has completed sign-up with email + password. Their Appwrite session persists across visits. They have profile fields (display name, avatar, school, grade, province, subjects) and can sign in via email/password or magic link.

**Top Nav**:
An iOS-style navigation bar at the top of the main content area. Left-aligned screen title, right-aligned sign-in button (unauthenticated) or avatar with dropdown menu (authenticated). Does not appear above the desktop sidebar — only above the main content column.

**Clean Layout**:
A full-screen layout used for auth pages (`/auth/*`). No sidebar, no bottom nav — just a centered form card. Used to keep focus on sign-in/sign-up without app chrome.

**Sync Queue**:
A Dexie-backed queue of offline mutations that are flushed to Appwrite when the user is online. On sign-up, the queue is processed immediately to transfer anonymous data to the authenticated user context.

**Magic Link**:
Appwrite's email-based sign-in flow (`createMagicURLToken`). Available only for sign-in (not sign-up). Sends a one-time link to the user's email; clicking it creates a session. Sign-up always uses email + password to preserve the anonymous user's ID.

**Profile Fields**:
Editable user attributes in Settings > Profile: display name, email (read-only + verify button), password (change form), avatar (UploadThing), and optional fields (school, grade, province, subjects).

## Relationships

- An **Anonymous User** upgrades to an **Authenticated User** on sign-up via `account.updateEmail()` + `account.updatePassword()` (same userId preserved).
- The **Top Nav** reflects user state: unauthenticated → Sign In button, authenticated → Avatar + DropdownMenu.
- **Auth pages** use the **Clean Layout**; all other pages use the app layout (sidebar + bottom nav + top nav).
- **Admin auth** (magic-link/OTP for `/admin/*`) is separate from student auth and unchanged by this system.
- On sign-up, the **Sync Queue** is flushed to move Dexie data to Appwrite.

## Flagged ambiguities

- "Auth" was used to mean both admin auth and student auth — resolved: these are separate systems with different flows and routes. Student auth uses anonymous → email/password conversion; admin auth uses server-side magic-link + OTP.
