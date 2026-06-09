import type { BloomLevel } from "@/lib/question-engine/types";

export interface CurriculumSubtopic {
	id: string;
	name: string;
	order: number;
	stories?: string[];
}

export interface CurriculumTopic {
	id: string;
	name: string;
	order: number;
	prerequisites: string[];
	bloomTarget: BloomLevel;
	subtopics: CurriculumSubtopic[];
}

export interface SubjectCurriculum {
	subjectId: string;
	subjectName: string;
	topics: CurriculumTopic[];
}
