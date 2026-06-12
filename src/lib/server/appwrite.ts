import { cookies } from "next/headers";
import {
	Account,
	Client,
	Databases,
	Storage,
	Users,
	ID,
} from "node-appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";

/**
 * Creates an Appwrite client for the current user session.
 */
export async function createSessionClient() {
	const client = new Client()
		.setEndpoint(APPWRITE_ENDPOINT)
		.setProject(APPWRITE_PROJECT);

	const cookieStore = await cookies();
	const session = cookieStore.get(`a_session_${APPWRITE_PROJECT}`);

	if (!session || !session.value) {
		throw new Error("No session found");
	}

	client.setSession(session.value);

	return {
		get account() { return new Account(client); },
		get databases() { return new Databases(client); },
		get storage() { return new Storage(client); },
	};
}

/**
 * Creates an Appwrite client with admin privileges.
 */
export async function createAdminClient() {
	const client = new Client()
		.setEndpoint(APPWRITE_ENDPOINT)
		.setProject(APPWRITE_PROJECT)
		.setKey(process.env.APPWRITE_API_KEY || "");

	return {
		get account() { return new Account(client); },
		get databases() { return new Databases(client); },
		get storage() { return new Storage(client); },
		get users() { return new Users(client); },
	};
}

/**
 * Server-side utility to get current user.
 */
export async function getLoggedInUser() {
	try {
		const { account } = await createSessionClient();
		return await account.get();
	} catch {
		return null;
	}
}

// Backward compatibility shim - proxy all Database calls to Admin client
export const databases = new Proxy({} as Databases, {
    get: (_target, prop) => {
        return async (...args: any[]) => {
            const admin = await createAdminClient();
            return (admin.databases as any)[prop](...args);
        };
    }
});

// Backward compatibility shim - proxy Account calls
export const serverAccount = new Proxy({} as Account, {
    get: (_target, prop) => {
        return async (...args: any[]) => {
            if (prop === 'get') {
                try {
                    const session = await createSessionClient();
                    return await session.account.get();
                } catch {
                    const admin = await createAdminClient();
                    return await admin.account.get();
                }
            }
            const admin = await createAdminClient();
            return (admin.account as any)[prop](...args);
        };
    }
});

export const serverClient = new Client()
	.setEndpoint(APPWRITE_ENDPOINT)
	.setProject(APPWRITE_PROJECT)
	.setKey(process.env.APPWRITE_API_KEY || "");
