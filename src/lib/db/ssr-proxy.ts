import { LumniOfflineDB } from "./schema";

let _offlineDB: LumniOfflineDB | undefined;

function noopTable(): unknown {
  return new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
        const chainable = [
          "where",
          "filter",
          "equals",
          "above",
          "below",
          "startsWithAnyOf",
          "anyOf",
          "limit",
          "offset",
          "reverse",
          "and",
          "or",
          "clone",
          "distinct",
          "each",
          "eachKey",
          "eachPrimaryKey",
          "eachUniqueKey",
          "first",
          "last",
        ];
        if (chainable.includes(prop)) return () => noopTable();
        return async (..._a: unknown[]) => {
          if (prop === "toArray") return [];
          if (prop === "get") return undefined;
          if (prop === "count") return 0;
          if (prop === "keys") return [];
          if (prop === "primaryKeys") return [];
          if (prop === "bulkAdd") return [];
          if (prop === "bulkPut") return [];
          if (prop === "bulkDelete") return [];
          if (prop === "put" || prop === "add") return undefined;
          if (prop === "delete" || prop === "clear") return undefined;
          if (prop === "update") return 0;
          if (prop === "modify") return 0;
          if (prop === "sortBy") return [];
          if (prop === "toCollection") return noopTable();
          return undefined;
        };
      },
    },
  );
}

function createOfflineDBProxy(): LumniOfflineDB {
  if (typeof window === "undefined") {
    return new Proxy({} as unknown as LumniOfflineDB, {
      get(_t, prop: string) {
        if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
        if (prop === "version" || prop === "verno" || prop === "name") return 0;
        if (prop === "isOpen") return () => false;
        if (prop === "open" || prop === "close" || prop === "delete") return async () => undefined;
        if (prop === "on" || prop === "table") return () => noopTable();
        if (prop === "tables") return [];
        if (prop === "transaction") return async (_r: unknown, f: () => Promise<void>) => f();
        return noopTable();
      },
    }) as unknown as LumniOfflineDB;
  }
  return new LumniOfflineDB();
}

export const offlineDB = createOfflineDBProxy();
export default offlineDB;
