import type {
	DiagramSpec as EngineDiagramSpec,
	GenerationParams as EngineGenerationParams,
	GradingResult as EngineGradingResult,
	MediaContent as EngineMediaContent,
	Option as EngineOption,
	Question as EngineQuestion,
	QuestionBody as EngineQuestionBody,
	QuestionType as EngineQuestionType,
	UserAnswer as EngineUserAnswer,
	ValidationError as EngineValidationError,
	ValidationResult as EngineValidationResult,
} from "@/lib/question-engine/types";

export type QuestionType = EngineQuestionType;
export type Question<T extends EngineQuestionType = EngineQuestionType> =
	EngineQuestion<T>;
export type QuestionBody = EngineQuestionBody;
export type Difficulty = EngineQuestion["difficulty"];
export type BloomLevel = EngineQuestion["bloomTaxonomy"];
export type Option = EngineOption;
export type RubricCriterion = {
	name: string;
	description: string;
	maxScore: number;
};
export type TestCase = {
	input: string;
	expectedOutput: string;
	description: string;
};
export type SubQuestion = {
	id: string;
	questionText: string;
	type: EngineQuestionType;
	points: number;
	body: EngineQuestionBody[EngineQuestionType];
};
export type Source = {
	type: "text" | "image" | "table" | "graph" | "map" | "infographic";
	content: string;
	attribution?: string;
	mediaUrl?: string;
};
export type DataSet = {
	type: "table" | "chart" | "graph";
	title: string;
	headers?: string[];
	rows?: Record<string, string | number>[];
	chartType?: "bar" | "line" | "pie" | "scatter";
	chartData?: Record<string, unknown>;
};
export type MixedPart = {
	id: string;
	questionText: string;
	type: EngineQuestionType;
	points: number;
	body: EngineQuestionBody[EngineQuestionType];
};
export type DiagramSpec = EngineDiagramSpec;
export type MediaContent = EngineMediaContent;
export type UserAnswer = EngineUserAnswer;
export type GradingResult = EngineGradingResult;
export type GenerationParams = EngineGenerationParams;
export type ValidationResult = EngineValidationResult;
export type ValidationError = EngineValidationError;

export type QAQuestion<T extends EngineQuestionType = EngineQuestionType> =
	EngineQuestion<T>;
export type QAOption = EngineOption;
export type QADiagram = EngineDiagramSpec;

export interface QAMetadata {
	subject: string;
	totalQuestions: number;
	version: string;
	curriculum: string;
	createdAt: string;
}

export interface QAFile {
	metadata: QAMetadata;
	questions: Question[];
}

export interface QuestionState {
	selectedOption: string | null;
	isCorrect: boolean | null;
	showHint: boolean;
	showExplanation: boolean;
	isSubmitted: boolean;
	showDiagram: boolean;
}
