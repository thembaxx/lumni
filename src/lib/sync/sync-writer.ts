import { dexieDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";
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
  "studyGuides",
  "vocabularyList",
  "pronunciationHistory",
  "storyCache",
  "storyQuestions",
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
    await enqueueOutbox(tableName, recordId, item.id ? "update" : "create", item).catch((e) =>
      logError("SyncWriter.put", e, { table: tableName, operation: "put" }),
    );
    return result;
  };

  (table as unknown as Record<string, unknown>).add = async (item: Record<string, unknown>) => {
    const result = await originalAdd(item);
    const recordId = String(result);
    await enqueueOutbox(tableName, recordId, "create", item).catch((e) =>
      logError("SyncWriter.add", e, { table: tableName, operation: "add" }),
    );
    return result;
  };

  (table as unknown as Record<string, unknown>).delete = async (id: string | number) => {
    await originalDelete(id);
    await enqueueOutbox(tableName, String(id), "delete", null).catch((e) =>
      logError("SyncWriter.delete", e, { table: tableName, operation: "delete" }),
    );
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
  {
    name: "studyGuides",
    table: dexieDataAccess.studyGuides as unknown as SyncableTableInterface,
  },
  {
    name: "vocabularyList",
    table: dexieDataAccess.vocabularyList as unknown as SyncableTableInterface,
  },
  {
    name: "pronunciationHistory",
    table: dexieDataAccess.pronunciationHistory as unknown as SyncableTableInterface,
  },
  {
    name: "storyCache",
    table: dexieDataAccess.storyCache as unknown as SyncableTableInterface,
  },
  {
    name: "storyQuestions",
    table: dexieDataAccess.storyQuestions as unknown as SyncableTableInterface,
  },
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
