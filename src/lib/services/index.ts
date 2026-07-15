export { analyticsService } from "./analytics-service";
export { bookmarkService, DexieBookmarkService } from "./bookmark-service";
export type { BookmarkService } from "./bookmark-service";

export { ttsService } from "./tts-service";
export type { TTSOptions, TTSVoice, TTSState } from "./tts-service";
export {
  trackEngineEvent,
  loadEvents,
  getAnalyticsSummary,
  clearAnalytics,
} from "./analytics-events";
export type { AnalyticsEvent } from "./analytics-events";
export { getWeeklyLeaderboard, saveWeeklySnapshot } from "./leaderboard-service";
export type { LeaderboardEntry } from "./leaderboard-service";
export {
  getSettings,
  initializeNotificationSchedulers,
  sendLocalNotification,
} from "./notification-service";
export type { NotificationSettings } from "./notification-service";
export type { PushPayload, PushDeliveryResult } from "./push-types";
export { questionRatingService } from "./question-rating-service";
export { processQuizResult } from "./quiz-result-processor";
export type { QuizResultDeps } from "./quiz-result-processor";
export { ReEngagementService } from "./re-engagement-service";
export { searchAll, searchWeb } from "./search-service";
export type { SearchResultItem } from "./search-service";
export { StudyBuddyService } from "./study-buddy-service";
export { StudyPlannerService } from "./study-planner-service";
export type { PlannerSnapshot } from "./study-planner-service";
export { userConsentService } from "./user-consent-service";
export { searchWeb as webSearch } from "./web-search-service";
