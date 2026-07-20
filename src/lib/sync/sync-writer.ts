export const SYNCABLE_TABLES_SET: ReadonlySet<string> = new Set([
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

export const SYNCABLE_TABLES: readonly string[] = [
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
];

export function isSyncableTableName(name: string): boolean {
  return SYNCABLE_TABLES_SET.has(name);
}

export const isSyncableTable = isSyncableTableName;

export async function initSyncWriters(): Promise<void> {
  // No-op: monkey-patching removed. Sync hooks are registered via explicit enqueueOutbox calls.
}
