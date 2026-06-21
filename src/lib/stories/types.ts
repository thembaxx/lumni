export type StoryLicense = "cc-by" | "public-domain" | "ai-generated";

export interface VocabWord {
	term: string;
	definition: string;
	partOfSpeech: string;
	pronunciation: string;
	language: string;
}

export interface StoryMeta {
	id: string;
	title: string;
	author: string;
	language: string;
	languageId: string;
	gradeLevel: string;
	wordCount: number;
	subjects: string[];
	source: "african-storybook" | "project-gutenberg" | "ai-generated" | "other";
	sourceUrl?: string;
	audioUrl?: string;
	readTimeMinutes?: number;
	topics: string[];
	license?: string;
}

export interface Story extends StoryMeta {
	content: string;
	vocabulary: VocabWord[];
}

export interface CachedStory {
	key: string;
	story: Story;
	createdAt: number;
	expiresAt: number;
}

export interface StoryQuestion {
	id: string;
	storyId: string;
	questionText: string;
	questionType:
		| "mcq"
		| "short-answer"
		| "fill-in-blank"
		| "true-false"
		| "matching";
	options?: string[];
	correctAnswer: string;
	explanation: string;
	bloomLevel: string;
	sentenceTemplate?: string;
	pairs?: { left: string; right: string }[];
}

export interface StoryQuestionSet {
	key: string;
	storyId: string;
	questions: StoryQuestion[];
	createdAt: number;
	expiresAt: number;
}
