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

function getSyncTables(): Array<SyncTableConfig> {
  if (!dexieDataAccess) return [];
  const da = dexieDataAccess;
  return [
    { name: "flashcards", table: da.flashcards as unknown as SyncableTableInterface },
    { name: "notes", table: da.notes as unknown as SyncableTableInterface },
    { name: "competencies", table: da.competencies as unknown as SyncableTableInterface },
    { name: "gamification", table: da.gamification as unknown as SyncableTableInterface },
    {
      name: "retentionRecurrence",
      table: da.retentionRecurrence as unknown as SyncableTableInterface,
    },
    { name: "wrongAnswers", table: da.wrongAnswers as unknown as SyncableTableInterface },
    { name: "chatMessages", table: da.chatMessages as unknown as SyncableTableInterface },
    { name: "questionRatings", table: da.questionRatings as unknown as SyncableTableInterface },
    { name: "bookmarks", table: da.bookmarks as unknown as SyncableTableInterface },
    { name: "examSessions", table: da.examSessions as unknown as SyncableTableInterface },
    { name: "quizAttempts", table: da.quizAttempts as unknown as SyncableTableInterface },
    { name: "studyPlans", table: da.studyPlans as unknown as SyncableTableInterface },
    { name: "studyGuides", table: da.studyGuides as unknown as SyncableTableInterface },
    { name: "vocabularyList", table: da.vocabularyList as unknown as SyncableTableInterface },
    {
      name: "pronunciationHistory",
      table: da.pronunciationHistory as unknown as SyncableTableInterface,
    },
    { name: "storyCache", table: da.storyCache as unknown as SyncableTableInterface },
    { name: "storyQuestions", table: da.storyQuestions as unknown as SyncableTableInterface },
  ];
}

let _initialized = false;

export async function initSyncWriters(): Promise<void> {
  if (_initialized) return;
  const tables = getSyncTables();
  for (const { name, table } of tables) {
    wrapTableForSync(name, table);
  }
  _initialized = true;
}

export const isSyncableTable = isSyncableTableName;
