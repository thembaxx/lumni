import type { SyncOutboxEntry } from "./types";

async function getTable() {
  const { offlineDB } = await import("@/lib/db/schema");
  // oxlint-disable-next-line typescript/no-explicit-any
  return offlineDB.table("syncOutbox") as any;
}

export async function enqueueOutbox(
  table: string,
  recordId: string,
  operation: "create" | "update" | "delete",
  data: unknown,
): Promise<void> {
  const t = await getTable();
  await t.add({
    table,
    recordId,
    operation,
    data: JSON.stringify(data),
    createdAt: Date.now(),
    retries: 0,
  });
}

export async function getPendingOutboxEntries(limit = 50): Promise<SyncOutboxEntry[]> {
  const t = await getTable();
  return t.orderBy("createdAt").limit(limit).toArray();
}

export async function removeOutboxEntries(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const t = await getTable();
  await t.bulkDelete(ids);
}

export async function incrementRetry(id: number): Promise<void> {
  const t = await getTable();
  const entry = await t.get(id);
  if (entry) {
    await t.update(id, { retries: entry.retries + 1 });
  }
}

export async function getOutboxCount(): Promise<number> {
  const t = await getTable();
  return t.count();
}
