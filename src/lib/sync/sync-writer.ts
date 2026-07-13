import { dexieDataAccess } from "@/lib/db";
import { enqueueOutbox } from "./outbox";

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

export function isSyncableTableName(name: string): boolean {
  return SYNCABLE_TABLES.has(name);
}

interface SyncableTableInterface {
  put(item: Record<string, unknown>): Promise<unknown>;
  add(item: Record<string, unknown>): Promise<unknown>;
  delete(id: string | number): Promise<void>;
}

export function wrapTableForSync(tableName: string, table: SyncableTableInterface): void {
  const originalPut = table.put.bind(table);
  const originalAdd = table.add.bind(table);
  const originalDelete = table.delete.bind(table);

  (table as unknown as Record<string, unknown>).put = async (item: Record<string, unknown>) => {
    const result = await originalPut(item);
    const recordId = String(item.id ?? result);
    await enqueueOutbox(tableName, recordId, item.id ? "update" : "create", item).catch(() => {});
    return result;
  };

  (table as unknown as Record<string, unknown>).add = async (item: Record<string, unknown>) => {
    const result = await originalAdd(item);
    const recordId = String(result);
    await enqueueOutbox(tableName, recordId, "create", item).catch(() => {});
    return result;
  };

  (table as unknown as Record<string, unknown>).delete = async (id: string | number) => {
    await originalDelete(id);
    await enqueueOutbox(tableName, String(id), "delete", null).catch(() => {});
    return undefined as unknown as void;
  };
}

interface SyncTableConfig {
  name: string;
  table: SyncableTableInterface;
}

const SYNC_TABLES: Array<SyncTableConfig> = [
  { name: "flashcards", table: dexieDataAccess.flashcards as unknown as SyncableTableInterface },
  { name: "notes", table: dexieDataAccess.notes as unknown as SyncableTableInterface },
  {
    name: "competencies",
    table: dexieDataAccess.competencies as unknown as SyncableTableInterface,
  },
  {
    name: "gamification",
    table: dexieDataAccess.gamification as unknown as SyncableTableInterface,
  },
  {
    name: "retentionRecurrence",
    table: dexieDataAccess.retentionRecurrence as unknown as SyncableTableInterface,
  },
  {
    name: "wrongAnswers",
    table: dexieDataAccess.wrongAnswers as unknown as SyncableTableInterface,
  },
  {
    name: "chatMessages",
    table: dexieDataAccess.chatMessages as unknown as SyncableTableInterface,
  },
  {
    name: "questionRatings",
    table: dexieDataAccess.questionRatings as unknown as SyncableTableInterface,
  },
  { name: "bookmarks", table: dexieDataAccess.bookmarks as unknown as SyncableTableInterface },
  {
    name: "examSessions",
    table: dexieDataAccess.examSessions as unknown as SyncableTableInterface,
  },
  {
    name: "quizAttempts",
    table: dexieDataAccess.quizAttempts as unknown as SyncableTableInterface,
  },
  { name: "studyPlans", table: dexieDataAccess.studyPlans as unknown as SyncableTableInterface },
];

let _initialized = false;

export async function initSyncWriters(): Promise<void> {
  if (_initialized) return;
  for (const { name, table } of SYNC_TABLES) {
    wrapTableForSync(name, table);
  }
  _initialized = true;
}

export const isSyncableTable = isSyncableTableName;
