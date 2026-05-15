export { getProgress, saveProgress } from "./repositories/progress";

export {
	cacheQuestions,
	getCachedQuestions,
} from "./repositories/question-cache";
export {
	addToSyncQueue,
	getAllSyncItems,
	getPendingSyncItems,
	removeSyncItem,
	resetStaleSyncingItems,
	updateSyncItem,
} from "./repositories/sync-queue";
export {
	cacheVisual,
	getCachedVisual,
	makeCacheKey,
} from "./repositories/visual-cache";
export type {
	CachedProgress,
	CachedQuestion,
	CachedSubject,
	CachedVisual,
	QuizAnswer,
	QuizAttempt,
	QuizSessionState,
	SyncConflict,
	SyncQueueItem,
} from "./schema";
export {
	LumniOfflineDB,
	offlineDB,
} from "./schema";
