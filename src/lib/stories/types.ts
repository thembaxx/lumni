import type { VocabWord } from "@/lib/lesson/types";
import type { Question } from "@/lib/question-engine/types";

export type StoryLicense = "cc-by" | "public-domain" | "ai-generated" | "other";

export interface Story {
	id: string;
	title: string;
	author: string;
	content: string;
	language: string;
	subjectId: string;
	source: "african-storybook" | "project-gutenberg" | "ai-generated" | "other";
	sourceUrl?: string;
	license: StoryLicense;
	audioUrl?: string;
	gradeLevel: string;
	wordCount: number;
	vocabulary: VocabWord[];
	topics: string[];
	readTimeMinutes?: number;
}

export interface CachedStory {
	key: string;
	story: Story;
	fetchedAt: number;
	expiresAt: number;
}

export interface StoryQuestionSet {
	storyId: string;
	questions: Question[];
	generatedAt: number;
	expiresAt: number;
}
