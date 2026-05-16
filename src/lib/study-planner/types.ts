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
	startDate: string; // ISO date string
	/** The end date for the study plan (e.g., exam date) */
	endDate: string; // ISO date string
}

export interface SubjectCompetency {
	/** The subject identifier */
	subjectId: SubjectId;
	/** The current competency level (0-100) */
	level: number;
	/** The target competency level (0-100) */
	targetLevel: number;
	/** The weight of this subject in the overall APS calculation */
	weight: number;
	/** The list of topics in this subject */
	topics: TopicId[];
}

export interface TopicPlan {
	/** The topic identifier */
	topicId: TopicId;
	/** The subject this topic belongs to */
	subjectId: SubjectId;
	/** The estimated time (in minutes) needed to master this topic */
	estimatedMinutes: number;
	/** The priority of this topic (higher means more important) */
	priority: number;
	/** The scheduled date for studying this topic (ISO date string) */
	scheduledDate?: string;
	/** The actual time spent on this topic (in minutes) */
	actualMinutesSpent: number;
	/** Whether the topic has been completed */
	isCompleted: boolean;
}

export interface StudyPlan {
	/** The settings used to generate this plan */
	settings: StudyPlanSettings;
	/** The list of subjects with their current competency */
	subjects: SubjectCompetency[];
	/** The list of topics with their planned schedule */
	topics: TopicPlan[];
	/** The total estimated time for the plan (in minutes) */
	totalEstimatedMinutes: number;
	/** The total actual time spent (in minutes) */
	totalActualMinutesSpent: number;
	/** The progress of the plan (0-100) */
	progress: number;
}
