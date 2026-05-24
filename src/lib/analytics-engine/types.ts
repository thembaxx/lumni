export interface SubjectAnalytics {
	subjectId: string;
	subjectName: string;
	totalQuestions: number;
	correctCount: number;
	accuracy: number;
	currentStreak: number;
	longestStreak: number;
	lastAttemptAt: number | null;
	weakTopics: TopicPerformance[];
	strongTopics: TopicPerformance[];
	history: PerformanceHistoryItem[];
}

export interface TopicPerformance {
	topic: string;
	total: number;
	correct: number;
	accuracy: number;
	avgTime: number;
	lastAttempt: number;
}

export interface PerformanceHistoryItem {
	date: string;
	questions: number;
	correct: number;
	accuracy: number;
	duration: number;
}

export interface OverallAnalytics {
	totalQuestions: number;
	totalCorrect: number;
	overallAccuracy: number;
	currentStreak: number;
	longestStreak: number;
	totalStudyTime: number;
	subjects: SubjectAnalytics[];
	weeklyProgress: PerformanceHistoryItem[];
	insights: string[];
	recommendations: AnalyticsRecommendation[];
}

export interface AnalyticsRecommendation {
	type: "practice" | "review" | "rest" | "exam";
	subject?: string;
	topic?: string;
	message: string;
	priority: number;
}

export interface ComparativeAnalytics {
	userPercentile: number;
	subjectRankings: Record<string, number>;
	globalAverage: number;
	userAverage: number;
}

export interface SubjectTrend {
	dates: string[];
	accuracies: number[];
	trend: "improving" | "declining" | "stable";
}
