import {
	Account,
	Client,
	Databases,
	Functions,
	type Models,
	Storage,
} from "appwrite";

export const APPWRITE_ENDPOINT =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
export const APPWRITE_PROJECT =
	process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

export const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";

const appwriteClient = new Client()
	.setEndpoint(APPWRITE_ENDPOINT)
	.setProject(APPWRITE_PROJECT);

const serverClient = new Client()
	.setEndpoint(APPWRITE_ENDPOINT)
	.setProject(APPWRITE_PROJECT)
	.setKey(APPWRITE_API_KEY);

export const storage = new Storage(appwriteClient);
export const functions = new Functions(appwriteClient);
export const databases = new Databases(serverClient);
export const account = new Account(appwriteClient);

export const initAppwriteClient = (sessionToken?: string) => {
	const client = new Client()
		.setEndpoint(APPWRITE_ENDPOINT)
		.setProject(APPWRITE_PROJECT);
	if (sessionToken) {
		client.setSession(sessionToken);
	}
	return client;
};

export const initStorage = (sessionToken?: string) => {
	const client = initAppwriteClient(sessionToken);
	return new Storage(client);
};

export const initFunctions = (sessionToken?: string) => {
	const client = initAppwriteClient(sessionToken);
	return new Functions(client);
};

export const initDatabases = (sessionToken?: string) => {
	const client = initAppwriteClient(sessionToken);
	return new Databases(client);
};

export type AppwriteFile = Models.File;
export type AppwriteBucket = Models.Bucket;
