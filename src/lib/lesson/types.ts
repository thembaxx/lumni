export type SectionType =
	| "introduction"
	| "concept"
	| "worked-example"
	| "comprehension-check"
	| "summary"
	| "practice";

export interface LessonSection {
	id: string;
	type: SectionType;
	title: string;
	content: string;
	keyPoints: string[];
}

export interface VocabWord {
	word: string;
	definition: string;
	partOfSpeech: string;
	pronunciation: string;
	language: string;
}

export interface Lesson {
	id: string;
	subjectId: string;
	topicId: string;
	subtopicId: string;
	title: string;
	order: number;
	prerequisites: string[];
	sections: LessonSection[];
	vocabulary: VocabWord[];
	difficulty: "easy" | "medium" | "hard";
	estimatedMinutes: number;
}

export interface CachedLesson {
	key: string;
	lesson: Lesson;
	createdAt: number;
	expiresAt: number;
}
