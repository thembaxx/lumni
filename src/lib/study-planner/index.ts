// Re-export all types
export type {
  SubjectId,
  TopicId,
  StudyPlanSettings,
  SubjectCompetency,
  TopicPlan,
  AlgorithmStudyPlan,
  StudySession,
  ExamDate,
  PersistenceStudyPlan,
  ExamDateInfo,
} from "./types";

// Backward-compat: PersistenceStudyPlan was the original StudyPlan
export type { PersistenceStudyPlan as StudyPlan } from "./types";

// Re-export persistence functions (will be consumed by StudyPlan importers)
export {
  loadStudyPlan,
  loadStudyPlanFromDexie,
  saveStudyPlan,
  markPlanStale,
  clearPlanStale,
  getWeekOldThreshold,
  addStudySession,
  updateStudySession,
  deleteStudySession,
  addExamDate,
  deleteExamDate,
  getUpcomingSessions,
  getUpcomingExams,
  getTodaySessions,
  autoScheduleSessions,
  getStudyStats,
} from "./persistence";

// Re-export algorithm module
export { generateStudyPlan } from "./algorithms";
export { getStudyPlannerService, StudyPlannerService } from "./study-planner-service";

// Re-export adaptive planner
export type {
  AdaptivePlanRequest,
  AdaptivePlanResponse,
  StudySession as AdaptiveStudySession,
  CompetencyGap,
  TopicGap,
} from "./adaptive-planner";
export { AdaptiveStudyPlanner, adaptiveStudyPlanner } from "./adaptive-planner";
