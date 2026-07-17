import {
  Account as NodeAccount,
  Client as NodeClient,
  Databases as NodeDatabases,
} from "node-appwrite";

const API_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://jnb.cloud.appwrite.io/v1";

export const APPWRITE_ENDPOINT = API_ENDPOINT;

export const APPWRITE_PROJECT =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || "";

export const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";

const SERVER_ENDPOINT = API_ENDPOINT;

function getServerClient(): NodeClient | null {
  if (!APPWRITE_PROJECT) return null;
  const c = new NodeClient()
    .setEndpoint(SERVER_ENDPOINT)
    .setProject(APPWRITE_PROJECT);
  if (APPWRITE_API_KEY) c.setKey(APPWRITE_API_KEY);
  return c;
}

let _databases: NodeDatabases | null = null;
function getDatabases(): NodeDatabases | null {
  if (_databases) return _databases;
  const c = getServerClient();
  if (!c) return null;
  _databases = new NodeDatabases(c);
  return _databases;
}

let _serverAccount: NodeAccount | null = null;
function getServerAccount(): NodeAccount | null {
  if (_serverAccount) return _serverAccount;
  const c = getServerClient();
  if (!c) return null;
  _serverAccount = new NodeAccount(c);
  return _serverAccount;
}

const serverClientProxy = new Proxy({} as NodeClient, {
  get(_target, prop) {
    const c = getServerClient();
    if (!c) return () => { throw new Error("Appwrite not configured"); };
    const value = Reflect.get(c, prop);
    if (typeof value === "function") return value.bind(c);
    return value;
  },
});

export { serverClientProxy as serverClient };

export const databases = new Proxy({} as NodeDatabases, {
  get(_target, prop) {
    const db = getDatabases();
    if (!db) return () => Promise.reject(new Error("Appwrite not configured"));
    const value = Reflect.get(db, prop);
    if (typeof value === "function") return value.bind(db);
    return value;
  },
});

export const serverAccount = new Proxy({} as NodeAccount, {
  get(_target, prop) {
    const acc = getServerAccount();
    if (!acc) return () => Promise.reject(new Error("Appwrite not configured"));
    const value = Reflect.get(acc, prop);
    if (typeof value === "function") return value.bind(acc);
    return value;
  },
});
