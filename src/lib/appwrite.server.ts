import {
	Account as NodeAccount,
	Client as NodeClient,
	Databases as NodeDatabases,
} from "node-appwrite";

const API_ENDPOINT =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
	"https://jnb.cloud.appwrite.io/v1";

export const APPWRITE_ENDPOINT = API_ENDPOINT;

export const APPWRITE_PROJECT =
	process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
	process.env.APPWRITE_PROJECT_ID ||
	"";

export const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";

const SERVER_ENDPOINT = API_ENDPOINT;

const serverClient = new NodeClient()
	.setEndpoint(SERVER_ENDPOINT)
	.setProject(APPWRITE_PROJECT)
	.setKey(APPWRITE_API_KEY);

const nodeDatabases = new NodeDatabases(serverClient);
export const serverAccount = new NodeAccount(serverClient);

export { serverClient };

export const databases = nodeDatabases;
