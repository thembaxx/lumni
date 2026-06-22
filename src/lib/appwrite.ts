import { Account, Databases as BrowserDatabases, Client, Functions, Storage } from "appwrite";

const API_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://jnb.cloud.appwrite.io/v1";

export const APPWRITE_ENDPOINT = API_ENDPOINT;

export const APPWRITE_PROJECT =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || "";

// Browser Client — lazy-initialized via getter to defer SDK construction
let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    _client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
  }
  return _client;
}

// Wrap in getters so SDK instances are only created on first method call
function lazyService<T extends object>(factory: (client: Client) => T): T {
  let instance: T | null = null;
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      if (!instance) instance = factory(getClient());
      const value = Reflect.get(instance, prop, receiver);
      if (typeof value === "function") {
        return value.bind(instance);
      }
      return value;
    },
  });
}

export const client = new Proxy({} as Client, {
  get(_target, prop) {
    const c = getClient();
    const value = Reflect.get(c, prop);
    if (typeof value === "function") return value.bind(c);
    return value;
  },
});
export const storage = lazyService((c) => new Storage(c));
export const functions = lazyService((c) => new Functions(c));
export const account = lazyService((c) => new Account(c));
export const browserDatabases = lazyService((c) => new BrowserDatabases(c));
