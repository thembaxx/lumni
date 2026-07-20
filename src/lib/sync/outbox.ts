import type { SyncDataAccessV2 } from "@/lib/db/data-access";
import type { SyncOutboxEntry } from "./types";

export async function enqueueOutbox(
  db: SyncDataAccessV2,
  table: string,
  recordId: string,
  operation: "create" | "update" | "delete",
  data: unknown,
): Promise<void> {
  await db.syncOutbox.add({
    table,
    recordId,
    operation,
    data: JSON.stringify(data),
    createdAt: Date.now(),
    retries: 0,
  });
}

export async function getPendingOutboxEntries(
  db: SyncDataAccessV2,
  limit = 50,
): Promise<SyncOutboxEntry[]> {
  return db.syncOutbox.orderBy("createdAt").limit(limit).toArray();
}

export async function removeOutboxEntries(db: SyncDataAccessV2, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await db.syncOutbox.bulkDelete(ids);
}

export async function incrementRetry(db: SyncDataAccessV2, id: number): Promise<void> {
  const entry = await db.syncOutbox.get(id);
  if (entry) {
    await db.syncOutbox.update(id, { retries: entry.retries + 1 });
  }
}

export async function getOutboxCount(db: SyncDataAccessV2): Promise<number> {
  return db.syncOutbox.count();
}
