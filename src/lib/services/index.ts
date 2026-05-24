export type ServiceResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export function success<T>(data: T): ServiceResult<T> {
	return { success: true, data };
}

export function failure<T = never>(error: string): ServiceResult<T> {
	return { success: false, error };
}

export { aiSolver } from "./ai-solver";
export { AnalyticsService, analyticsService } from "./analytics-service";
export { chatImageService } from "./chat-image";
export { curatedProblemsService } from "./curated-problems";
export { elementFactService } from "./element-fact";
export type { LeaderboardEntry } from "./leaderboard-service";
export {
	fetchLeaderboardFromServer,
	getLocalLeaderboard,
	getWeeklyLeaderboard,
	saveWeeklySnapshot,
} from "./leaderboard-service";
export type {
	NotificationSettings,
	StudyReminder,
} from "./notification-service";
export {
	cancelScheduledReminder,
	getNextReminder,
	getSettings,
	requestPermission,
	saveSettings,
	scheduleExamAlerts,
	schedulePlanAwareReminder,
	scheduleStudyReminder,
	sendLocalNotification,
	subscribeToPush,
	unsubscribeFromPush,
} from "./notification-service";
export {
	QuestionRatingService,
	questionRatingService,
} from "./question-rating-service";
export type { SearchResultItem } from "./search-service";
export { searchAll, searchByType } from "./search-service";
