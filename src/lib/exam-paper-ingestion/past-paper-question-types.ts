import type { QuestionType } from "@/lib/question-engine/types";

export interface PastPaperQuestion {
	id: string;
	subject: string;
	topic?: string;
	year: number;
	paperNumber: number;
	sectionTitle?: string;
	questionId: string;
	partId: string;
	questionText: string;
	answerText: string;
	marks: number;
	questionType: QuestionType;
	bloomLevel?: string;
	createdAt: string;
}

export interface ExtractedPaper {
	questions: PastPaperQuestion[];
	metadata: {
		subject: string;
		year: number;
		paperNumber: number;
		examPeriod: string;
	};
}
