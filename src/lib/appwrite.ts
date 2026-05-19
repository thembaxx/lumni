import { Account, Client, Functions, Storage } from "appwrite";
import {
	Account as NodeAccount,
	Client as NodeClient,
	Databases as NodeDatabases,
} from "node-appwrite";

export const APPWRITE_ENDPOINT =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
export const APPWRITE_PROJECT =
	process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

export const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";

const appwriteClient = new Client()
	.setEndpoint(APPWRITE_ENDPOINT)
	.setProject(APPWRITE_PROJECT);

const serverClient = new NodeClient()
	.setEndpoint(APPWRITE_ENDPOINT)
	.setProject(APPWRITE_PROJECT)
	.setKey(APPWRITE_API_KEY);

export const storage = new Storage(appwriteClient);
export const functions = new Functions(appwriteClient);
export const databases = new NodeDatabases(serverClient);
export const serverAccount = new NodeAccount(serverClient);
export const account = new Account(appwriteClient);

export { serverClient };
