import { cookies } from "next/headers";
import { Account, Client, type Models } from "node-appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";

export async function auth(): Promise<string> {
	const userId = await getAuthenticatedUserId();
	if (!userId) throw new Error("Authentication required");
	return userId;
}

export async function verifyAuth(userId: string): Promise<void> {
	try {
		const cookieStore = await cookies();
		const projectId = APPWRITE_PROJECT;
		if (!projectId) {
			console.error("[verifyAuth] APPWRITE_PROJECT is not set");
			throw new Error("Configuration error: APPWRITE_PROJECT is missing");
		}

		let sessionCookie = cookieStore.get(`a_session_${projectId}`);
		if (!sessionCookie?.value) {
			sessionCookie = cookieStore.get(`a_session_${projectId}_legacy`);
		}

		// Fallback: search for any a_session_ cookie if the specific one is missing
		if (!sessionCookie?.value) {
			const fallbackCookie = cookieStore
				.getAll()
				.find((c) => c.name.startsWith("a_session_"));
			if (fallbackCookie) {
				console.warn(
					`[auth] Found fallback session cookie: ${fallbackCookie.name} instead of a_session_${projectId}`,
				);
				sessionCookie = fallbackCookie;
			}
		}

		if (!sessionCookie?.value) {
			const allCookies = (await cookies()).getAll().map((c) => c.name);
			console.warn(
				`[verifyAuth] No session cookie found for project: ${projectId}. Available cookies: ${allCookies.join(", ")}`,
			);
			throw new Error(`No session cookie found for project: ${projectId}`);
		}

		const client = new Client()
			.setEndpoint(APPWRITE_ENDPOINT)
			.setProject(projectId)
			.setSession(sessionCookie.value);

		const account = new Account(client);
		let user: Models.User<Models.Preferences>;
		let retries = 0;
		// Retry loop: each attempt depends on the previous one failing (must run sequentially)
		while (true) {
			try {
				user = await account.get();
				break;
			} catch (err) {
				retries++;
				if (retries >= 2) throw err;
				// Exponential backoff
				await new Promise((resolve) => setTimeout(resolve, 500 * retries));
			}
		}

		if (user.$id !== userId) {
			console.warn(
				`[verifyAuth] User ID mismatch. Session user: ${user.$id}, requested user: ${userId}`,
			);
			throw new Error("Unauthorized: User ID mismatch");
		}
	} catch (err) {
		console.error("[verifyAuth] Auth failure:", err);
		throw new Error("Authentication required");
	}
}

export async function getAuthenticatedUserId(): Promise<string | null> {
	try {
		const cookieStore = await cookies();
		const projectId = APPWRITE_PROJECT;
		if (!projectId) {
			console.error("[getAuthenticatedUserId] APPWRITE_PROJECT is not set");
			return null;
		}

		let sessionCookie = cookieStore.get(`a_session_${projectId}`);
		if (!sessionCookie?.value) {
			sessionCookie = cookieStore.get(`a_session_${projectId}_legacy`);
		}

		// Fallback: search for any a_session_ cookie if the specific one is missing
		if (!sessionCookie?.value) {
			const fallbackCookie = cookieStore
				.getAll()
				.find((c) => c.name.startsWith("a_session_"));
			if (fallbackCookie) {
				console.warn(
					`[auth] Found fallback session cookie: ${fallbackCookie.name} instead of a_session_${projectId}`,
				);
				sessionCookie = fallbackCookie;
			}
		}

		if (!sessionCookie?.value) {
			// Silently fail for getAuthenticatedUserId as it's often used for optional auth
			return null;
		}

		const client = new Client()
			.setEndpoint(APPWRITE_ENDPOINT)
			.setProject(projectId)
			.setSession(sessionCookie.value);

		const account = new Account(client);
		let user: Models.User<Models.Preferences>;
		let retries = 0;
		// Retry loop: each attempt depends on the previous one failing (must run sequentially)
		while (true) {
			try {
				user = await account.get();
				break;
			} catch (err) {
				retries++;
				if (retries >= 2) throw err;
				await new Promise((resolve) => setTimeout(resolve, 500 * retries));
			}
		}
		return user.$id;
	} catch (err) {
		console.error("[getAuthenticatedUserId] Auth error:", err);
		return null;
	}
}

export async function requireAdmin(): Promise<string> {
	const userId = await auth();

	const adminIds = process.env.ADMIN_USER_IDS;
	if (adminIds) {
		const ids = adminIds.split(",").flatMap((s) => {
			const trimmed = s.trim();
			return trimmed ? [trimmed] : [];
		});
		if (ids.length > 0 && !ids.includes(userId)) {
			throw new Error("Admin access required");
		}
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
	} catch {
		return null;
	}
}
