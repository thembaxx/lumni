import { cookies } from "next/headers";
import { Account, Client, type Models } from "node-appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";
import { logError } from "@/lib/shared/logger";

const MAX_AUTH_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

function isValidUserId(userId: string): boolean {
  if (!userId || typeof userId !== "string") return false;
  if (userId.length < 1 || userId.length > 128) return false;
  if (/[/\\<>:"|?*]/.test(userId) || /[^\x20-\x7E]/.test(userId)) return false;
  return /^[a-zA-Z0-9_-]+$/.test(userId);
}

// Single-step helper extracted so the retry loop body has no direct `await`.
// The `try/catch` lives inside the helper and surfaces the error up.
async function tryFetchAccount(account: Account): Promise<Models.User<Models.Preferences>> {
  return account.get();
}

async function waitForBackoff(retries: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_DELAY_MS * retries));
}

// Recursive retry step. Each step is a self-call so the public entry point
// `fetchAccountWithRetry` doesn't contain `await` inside a loop body.
async function fetchAccountWithRetryStep(
  account: Account,
  retries: number,
): Promise<Models.User<Models.Preferences>> {
  try {
    return await tryFetchAccount(account);
  } catch (err) {
    logError("FetchAccountWithRetryStep", err);
    if (retries >= MAX_AUTH_RETRIES) throw err;
    await waitForBackoff(retries + 1);
    return fetchAccountWithRetryStep(account, retries + 1);
  }
}

async function fetchAccountWithRetry(account: Account): Promise<Models.User<Models.Preferences>> {
  return fetchAccountWithRetryStep(account, 0);
}

export async function auth(): Promise<string> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Authentication required");

  if (!isValidUserId(userId)) {
    logError("InvalidUserId", new Error(`Invalid user ID format: ${userId}`));
    throw new Error("Authentication required");
  }

  return userId;
}

export async function verifyAuth(userId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const projectId = APPWRITE_PROJECT;
    if (!projectId) {
      logError("VerifyAuthConfig", new Error("APPWRITE_PROJECT is not set"));
      throw new Error("Configuration error: APPWRITE_PROJECT is missing");
    }

    const sessionCookie = cookieStore.get(`a_session_${projectId}`);
    if (!sessionCookie?.value) {
      const allCookies = (await cookies()).getAll().map((c) => c.name);
      logError(
        "VerifyAuth.NoSessionCookie",
        new Error(
          `No session cookie found for project: ${projectId}. Available: ${allCookies.join(", ")}`,
        ),
      );
      throw new Error(`No session cookie found for project: ${projectId}`);
    }

    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(projectId)
      .setSession(sessionCookie.value);

    const account = new Account(client);
    const user = await fetchAccountWithRetry(account);

    if (user.$id !== userId) {
      logError(
        "VerifyAuth.UserIdMismatch",
        new Error(`Session user: ${user.$id}, requested: ${userId}`),
      );
      throw new Error("Unauthorized: User ID mismatch");
    }
  } catch (err) {
    logError("VerifyAuth", err);
    throw new Error("Authentication required", { cause: err });
  }
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const projectId = APPWRITE_PROJECT;
    if (!projectId) {
      logError("GetAuthenticatedUserIdConfig", new Error("APPWRITE_PROJECT is not set"));
      return null;
    }

    const sessionCookie = cookieStore.get(`a_session_${projectId}`);
    if (!sessionCookie?.value) {
      // Silently fail for getAuthenticatedUserId as it's often used for optional auth
      return null;
    }

    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(projectId)
      .setSession(sessionCookie.value);

    const account = new Account(client);
    const user = await fetchAccountWithRetry(account);
    return user.$id;
  } catch (err) {
    logError("GetAuthenticatedUserId", err);
    return null;
  }
}

export async function requireAdmin(): Promise<string> {
  const userId = await auth();

  const adminIds = process.env.ADMIN_USER_IDS;
  if (!adminIds) {
    logError("RequireAdmin.NotConfigured", new Error("ADMIN_USER_IDS is not set"));
    throw new Error("Admin access is not configured");
  }

  const ids = adminIds.split(",").flatMap((s) => {
    const trimmed = s.trim();
    return trimmed ? [trimmed] : [];
  });

  if (ids.length === 0) {
    logError("RequireAdmin.EmptyIds", new Error("ADMIN_USER_IDS is empty"));
    throw new Error("Admin access is not configured");
  }

  if (!ids.includes(userId)) {
    logError("RequireAdminUnauthorized", new Error(`User ${userId} attempted admin access`));
    throw new Error("Admin access required");
  }

  return userId;
}

export async function getAuthenticatedUserName(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(`a_session_${APPWRITE_PROJECT}`);
    if (!sessionCookie?.value) return null;

    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT)
      .setSession(sessionCookie.value);

    const account = new Account(client);
    const user = await account.get();
    return user.name || null;
  } catch (err) {
    logError("GetAuthenticatedUserName", err);
    return null;
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;

    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export function isTeacher(userId: string): boolean {
  if (!userId) return false;
  const teacherIds = process.env.TEACHER_USER_IDS;
  if (!teacherIds) return false;
  const ids = teacherIds.split(",").flatMap((s) => {
    const trimmed = s.trim();
    return trimmed ? [trimmed] : [];
  });
  return ids.includes(userId);
}

export async function requireTeacher(): Promise<string> {
  const userId = await auth();
  if (!isTeacher(userId)) {
    logError("RequireTeacher.Unauthorized", new Error(`User ${userId} attempted teacher access`));
    throw new Error("Teacher access required");
  }
  return userId;
}
