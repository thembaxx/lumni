import {
	Account,
	Databases as BrowserDatabases,
	Client,
	Functions,
	Storage,
} from "appwrite";

const API_ENDPOINT =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
	"https://jnb.cloud.appwrite.io/v1";

export const APPWRITE_ENDPOINT = API_ENDPOINT;

export const APPWRITE_PROJECT =
	process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
	process.env.APPWRITE_PROJECT_ID ||
	"";

// Browser Client
const appwriteClient = new Client()
	.setEndpoint(APPWRITE_ENDPOINT)
	.setProject(APPWRITE_PROJECT);

export const client = appwriteClient;
export const storage = new Storage(appwriteClient);
export const functions = new Functions(appwriteClient);
export const account = new Account(appwriteClient);
export const browserDatabases = new BrowserDatabases(appwriteClient);
