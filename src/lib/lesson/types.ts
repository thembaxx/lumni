export interface LessonSection {
	id: string;
	title: string;
	content: string;
	type: "concept" | "example" | "activity" | "summary";
	keyPoints?: string[];
}

export interface VocabWord {
	term: string;
	definition: string;
}

export interface Lesson {
	sections: LessonSection[];
	summary: string;
	estimatedMinutes: number;
	vocabulary?: VocabWord[];
}

export interface CachedLesson {
	key: string;
	lesson: Lesson;
	subject: string;
	topic: string;
	subtopic: string;
	createdAt: number;
	expiresAt: number;
}
