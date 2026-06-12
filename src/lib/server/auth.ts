"use server";
import { type Models } from "node-appwrite";
import { logError } from "@/lib/shared/logger";
import { getLoggedInUser } from "./appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ID } from "node-appwrite";
import { APPWRITE_PROJECT } from "@/lib/appwrite";
import { createAdminClient, createSessionClient } from "./appwrite";

export async function auth(): Promise<string> {
	const userId = await getAuthenticatedUserId();
	if (!userId) throw new Error("Authentication required");
	return userId;
}

export async function verifyAuth(userId: string): Promise<void> {
	try {
		const user = await getLoggedInUser();

		if (!user) {
			throw new Error("Authentication required");
		}

		if (user.$id !== userId) {
			console.warn(
				`[verifyAuth] User ID mismatch. Session user: ${user.$id}, requested user: ${userId}`,
			);
			throw new Error("Unauthorized: User ID mismatch");
		}
	} catch (err) {
		logError("VerifyAuth", err);
		throw new Error("Authentication required");
	}
}

export async function getAuthenticatedUserId(): Promise<string | null> {
	try {
		const user = await getLoggedInUser();
		return user?.$id ?? null;
	} catch (err) {
		logError("GetAuthenticatedUserId", err);
		return null;
	}
}

export async function requireAdmin(): Promise<string> {
	const userId = await auth();

	const adminIds = process.env.ADMIN_USER_IDS;
	if (!adminIds) {
		throw new Error("Admin access is not configured");
	}

	const ids = adminIds.split(",").map(s => s.trim());

	if (!ids.includes(userId)) {
		throw new Error("Admin access required");
	}

	return userId;
}

export async function getAuthenticatedUserName(): Promise<string | null> {
	try {
		const user = await getLoggedInUser();
		return user?.name || null;
	} catch (err) {
		logError("GetAuthenticatedUserName", err);
		return null;
	}
}

export async function signUpWithEmail(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const name = formData.get("name") as string;

	const { account } = await createAdminClient();

	try {
		await account.create(ID.unique(), email, password, name);
		const session = await account.createEmailPasswordSession(email, password);

		(await cookies()).set(`a_session_${APPWRITE_PROJECT}`, session.secret, {
			path: "/",
			httpOnly: true,
			sameSite: "strict",
			secure: true,
		});

		return { success: true };
	} catch (error) {
		logError("signUpWithEmail", error);
		return { success: false, error: (error as Error).message };
	}
}

export async function signInWithEmail(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	const { account } = await createAdminClient();

	try {
		const session = await account.createEmailPasswordSession(email, password);

		(await cookies()).set(`a_session_${APPWRITE_PROJECT}`, session.secret, {
			path: "/",
			httpOnly: true,
			sameSite: "strict",
			secure: true,
		});

		return { success: true };
	} catch (error) {
		logError("signInWithEmail", error);
		return { success: false, error: (error as Error).message };
	}
}

export async function signOut() {
	try {
		const { account } = await createSessionClient();
		await account.deleteSession("current");
	} catch {}

	(await cookies()).delete(`a_session_${APPWRITE_PROJECT}`);
	redirect("/auth/sign-in");
}
