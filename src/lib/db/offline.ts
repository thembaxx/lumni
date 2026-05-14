export {
	LumniOfflineDB,
	offlineDB,
} from "./schema";
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

export { cacheQuestions, getCachedQuestions } from "./repositories/question-cache";
export { saveProgress, getProgress } from "./repositories/progress";
export {
	addToSyncQueue,
	addToSyncQueueWithPriority,
	clearSyncQueue,
	getAllSyncItems,
	getNextSyncItem,
	getPendingSyncItems,
	getSyncQueueStats,
	markSyncItemFailed,
	markSyncItemSuccess,
	markSyncItemSyncing,
	removeSyncItem,
	retryFailedSyncItems,
	updateSyncItem,
} from "./repositories/sync-queue";
export { calculateBackoffDelay } from "./repositories/sync-queue";
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
	cacheVisual,
	getCachedVisual,
	makeCacheKey,
} from "./repositories/visual-cache";
export {
	clearResolvedConflicts,
	getUnresolvedConflicts,
	resolveConflict,
	saveConflict,
} from "./repositories/conflicts";
