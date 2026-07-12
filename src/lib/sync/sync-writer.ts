import { enqueueOutbox } from "./outbox";

type SyncableTable =
  | "flashcards"
  | "notes"
  | "competencies"
  | "gamification"
  | "retentionRecurrence"
  | "wrongAnswers"
  | "chatMessages"
  | "questionRatings"
  | "bookmarks"
  | "examSessions"
  | "quizAttempts"
  | "studyPlans";

const SYNCABLE_TABLES: ReadonlySet<string> = new Set([
  "flashcards",
  "notes",
  "competencies",
  "gamification",
  "retentionRecurrence",
  "wrongAnswers",
  "chatMessages",
  "questionRatings",
  "bookmarks",
  "examSessions",
  "quizAttempts",
  "studyPlans",
]);

export function isSyncableTable(tableName: string): boolean {
  return SYNCABLE_TABLES.has(tableName);
}

export function wrapTableForSync(
  tableName: SyncableTable,
  table: {
    put(item: unknown): Promise<unknown>;
    add(item: unknown): Promise<unknown>;
    delete(id: string | number): Promise<void>;
  },
): void {
  const originalPut = table.put.bind(table);
  const originalAdd = table.add.bind(table);
  const originalDelete = table.delete.bind(table);

  (table as Record<string, unknown>).put = async (item: Record<string, unknown>) => {
    const result = await originalPut(item);
    const recordId = String(item.id ?? result);
    await enqueueOutbox(tableName, recordId, item.id ? "update" : "create", item).catch(() => {});
    return result;
  };

  (table as Record<string, unknown>).add = async (item: Record<string, unknown>) => {
    const result = await originalAdd(item);
    const recordId = String(result);
    await enqueueOutbox(tableName, recordId, "create", item).catch(() => {});
    return result;
  };

  (table as Record<string, unknown>).delete = async (id: string | number) => {
    await originalDelete(id);
    await enqueueOutbox(tableName, String(id), "delete", null).catch(() => {});
    return;
  };
}
