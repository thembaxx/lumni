import type { JobHandler } from "./index";

import { Query } from "appwrite";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";
import { safePersist } from "@/lib/db/persist";

export async function upsertDocument(
  collection: string,
  findQuery: string[],
  data: Record<string, unknown>,
): Promise<void> {
  const existing = await listDocuments<Record<string, unknown>>(collection, findQuery);
  const now = new Date().toISOString();
  if (existing.length > 0) {
    await updateDocument(collection, existing[0].$id as string, {
      ...data,
      updatedAt: now,
    });
  } else {
    await createDocument(collection, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export function createUpsertHandler(
  collection: string,
  keyFields: Record<string, string>,
  toData: (payload: Record<string, unknown>) => Record<string, unknown>,
) {
  return async (payload: unknown) => {
    const data = payload as Record<string, unknown>;
    const queries = Object.entries(keyFields).map(([queryField, dataField]) =>
      Query.equal(queryField, data[dataField] as string),
    );
    await upsertDocument(collection, queries, toData(data));
  };
}

export function createJobHandler(
  name: string,
  fn: (payload: unknown) => Promise<void>,
  options?: { usePersist?: boolean },
): JobHandler {
  return async (payload: unknown) => {
    const work = () => fn(payload);
    if (options?.usePersist) {
      await safePersist(name, work);
      return;
    }
    try {
      await work();
    } catch (e) {
      logError(`JobHandler.${name}`, e);
    }
  };
}

export function createAppendHandler(
  collection: string,
  toData: (payload: Record<string, unknown>) => Record<string, unknown>,
) {
  return async (payload: unknown) => {
    const data = payload as Record<string, unknown>;
    await createDocument(collection, toData(data));
  };
}

export function createDeleteHandler(collection: string, keyFields: Record<string, string>) {
  return async (payload: unknown) => {
    const data = payload as Record<string, unknown>;
    const queries = Object.entries(keyFields).map(([queryField, dataField]) =>
      Query.equal(queryField, data[dataField] as string),
    );
    const existing = await listDocuments<Record<string, unknown>>(collection, queries);
    await Promise.all(existing.map((doc) => deleteDocument(collection, doc.$id as string)));
  };
}
