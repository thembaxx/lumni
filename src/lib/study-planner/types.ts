export type SubjectId = string;
export type TopicId = string;

export interface StudyPlanSettings {
  /** The target APS score the user is aiming for */
  targetAps: number;
  /** The total number of minutes the user wants to study per day */
  dailyStudyMinutes: number;
  /** The preferred time of day to study (morning, afternoon, evening) */
  preferredStudyTime: "morning" | "afternoon" | "evening";
  /** The days of the week the user wants to study (0-6, where 0 is Sunday) */
  studyDays: number[];
  /** The start date for the study plan */
  startDate: string;
  /** The end date for the study plan (e.g., exam date) */
  endDate: string;
}

export interface SubjectCompetency {
  subjectId: SubjectId;
  level: number;
  targetLevel: number;
  weight: number;
  topics: TopicId[];
  completedTopics?: TopicId[];
}

export interface TopicPlan {
  topicId: TopicId;
  subjectId: SubjectId;
  estimatedMinutes: number;
  priority: number;
  scheduledDate?: string;
  actualMinutesSpent: number;
  isCompleted: boolean;
}

export interface AlgorithmStudyPlan {
  settings: StudyPlanSettings;
  subjects: SubjectCompetency[];
  topics: TopicPlan[];
  totalEstimatedMinutes: number;
  totalActualMinutesSpent: number;
  progress: number;
}

// ============================================================
// Persistence types
// ============================================================

export interface StudySession {
  id: string;
  subject: string;
  topic?: string;
  type: "quiz" | "flashcard" | "exam" | "review";
  scheduledAt: number;
  duration: number;
  completed: boolean;
  completedAt?: number;
  actualDuration?: number;
  notes?: string;
  repeat?: "daily" | "weekly" | "none";
}

export interface ExamDate {
  id: string;
  subject: string;
  paper: string;
  date: number;
  daysUntil: number;
  notes?: string;
}

export interface PersistenceStudyPlan {
  sessions: StudySession[];
  examDates: ExamDate[];
  generatedAt: number;
  stale: boolean;
  lastCompetencyRefresh: number;
  progress?: number;
  totalActualMinutes?: number;
}

export interface ExamDateInfo {
  subjectId: string;
  date: string;
}
