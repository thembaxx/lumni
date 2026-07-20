import type { DataAccess } from "@/lib/db/data-access";
import type { SyncOutboxEntry } from "./types";

export async function enqueueOutbox(
  db: DataAccess,
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
  db: DataAccess,
  limit = 50,
): Promise<SyncOutboxEntry[]> {
  return db.syncOutbox.orderBy("createdAt").limit(limit).toArray();
}

export async function removeOutboxEntries(db: DataAccess, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await db.syncOutbox.bulkDelete(ids);
}

export async function incrementRetry(db: DataAccess, id: number): Promise<void> {
  const entry = await db.syncOutbox.get(id);
  if (entry) {
    await db.syncOutbox.update(id, { retries: entry.retries + 1 });
  }
}

export async function getOutboxCount(db: DataAccess): Promise<number> {
  return db.syncOutbox.count();
}
