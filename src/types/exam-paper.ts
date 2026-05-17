import type {
	Option as QuestionEngineOption,
	QuestionType,
} from "@/lib/question-engine/types";

export interface ExamPaper {
	metadata: PaperMetadata;
	instructions: string[];
	sections: Section[];
}

export interface PaperMetadata {
	subject: string;
	paperCode: string;
	examPeriod: string;
	year: number;
	grade: number;
	qualification: string;
	language: string;
	totalMarks: number;
	duration: string;
	pageCount?: number | null;
}

export interface Section {
	id: string;
	title?: string | null;
	instructions?: string[];
	questions: Question[];
}

export interface Question {
	id: string;
	title?: string | null;
	context?: ContentBlock[] | null;
	parts: QuestionPart[];
	totalMarks?: number | null;
}

export interface QuestionPart {
	id: string;
	text?: string | null;
	content?: ContentBlock[] | null;
	marks?: number | string | null;
	answerFormat?: string | null;
	type: QuestionType;
	options?: Option[] | null;
	table?: DataTable | null;
	sourceRefs?: string[] | null;
	subParts?: QuestionPart[] | null;
}

export interface ContentBlock {
	type: "text" | "image" | "table" | "formula" | "code";
	value?: string;
	imagePath?: string;
	altText?: string;
	tableData?: DataTable;
	language?: string;
}

export interface DataTable {
	headers: string[];
	rows: (string | number | null)[][];
}

export type Option = QuestionEngineOption;
export type { QuestionType };
