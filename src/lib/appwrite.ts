import {
	Account,
	Databases as BrowserDatabases,
	Client,
	Functions,
	Storage,
} from "appwrite";
import {
	Account as NodeAccount,
	Client as NodeClient,
	Databases as NodeDatabases,
} from "node-appwrite";

const isBrowser = typeof window !== "undefined";

const API_ENDPOINT =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
	"https://jnb.cloud.appwrite.io/v1";

export const APPWRITE_ENDPOINT = API_ENDPOINT;

export const APPWRITE_PROJECT =
	process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
	process.env.APPWRITE_PROJECT_ID ||
	"";

export const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";

// Browser Client
const appwriteClient = new Client()
	.setEndpoint(APPWRITE_ENDPOINT)
	.setProject(APPWRITE_PROJECT);

export const client = appwriteClient;
export const storage = new Storage(appwriteClient);
export const functions = new Functions(appwriteClient);
export const account = new Account(appwriteClient);
export const browserDatabases = new BrowserDatabases(appwriteClient);

// Server Client (Always uses absolute URL and API key)
const SERVER_ENDPOINT = API_ENDPOINT;

const serverClient = new NodeClient()
	.setEndpoint(SERVER_ENDPOINT)
	.setProject(APPWRITE_PROJECT)
	.setKey(APPWRITE_API_KEY);

const nodeDatabases = new NodeDatabases(serverClient);
export const serverAccount = new NodeAccount(serverClient);

// Environment-aware Databases export
export const databases = isBrowser
	? (browserDatabases as unknown as NodeDatabases)
	: nodeDatabases;

export { serverClient };
