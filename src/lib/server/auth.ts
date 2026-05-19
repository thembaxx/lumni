import { cookies } from "next/headers";
import { Account, Client } from "node-appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";

export async function verifyAuth(userId: string): Promise<void> {
	try {
		const cookieStore = await cookies();
		const projectId = APPWRITE_PROJECT;
		const sessionCookie = cookieStore.get(`a_session_${projectId}`);
		if (!sessionCookie?.value) throw new Error("No session");

		const client = new Client()
			.setEndpoint(APPWRITE_ENDPOINT)
			.setProject(projectId)
			.setSession(sessionCookie.value);

		const account = new Account(client);
		const user = await account.get();
		if (user.$id !== userId) throw new Error("Unauthorized");
	} catch {
		throw new Error("Authentication required");
	}
}

export async function getAuthenticatedUserId(): Promise<string | null> {
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
		return user.$id;
	} catch {
		return null;
	}
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
