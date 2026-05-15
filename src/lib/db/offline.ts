export {
	clearResolvedConflicts,
	getUnresolvedConflicts,
	resolveConflict,
	saveConflict,
} from "./repositories/conflicts";
export { getProgress, saveProgress } from "./repositories/progress";

export {
	cacheQuestions,
	getCachedQuestions,
} from "./repositories/question-cache";
export {
	clearOldQuizSessions,
	deleteQuizSession,
	getActiveQuizSession,
	getAllPausedSessions,
	getQuizAttempts,
	getQuizSession,
	pauseQuizSession,
	resumeQuizSession,
	saveQuizAttempt,
	saveQuizSession,
} from "./repositories/quiz-session";
export {
	addToSyncQueue,
	addToSyncQueueWithPriority,
	calculateBackoffDelay,
	clearSyncQueue,
	getAllSyncItems,
	getNextSyncItem,
	getPendingSyncItems,
	getSyncQueueStats,
	markSyncItemFailed,
	markSyncItemSuccess,
	markSyncItemSyncing,
	removeSyncItem,
	resetStaleSyncingItems,
	retryFailedSyncItems,
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
