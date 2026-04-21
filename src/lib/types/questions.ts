export interface QAQuestion {
	id: string;
	topic: string;
	difficulty: "Easy" | "Medium" | "Hard";
	points: number;
	questionText: string;
	questionType: "multiple-choice";
	options: QAOption[];
	supportsDiagram: boolean;
	diagram: QADiagram | null;
	hint: string;
	explanation: string;
}

export interface QAOption {
	id: string;
	text: string;
	isCorrect: boolean;
}

export interface QADiagram {
	type: "force-vector" | "circuit" | "wave" | "motion";
	title: string;
	data: Record<string, unknown>;
}

export interface QAMetadata {
	subject: string;
	totalQuestions: number;
	version: string;
	curriculum: string;
	createdAt: string;
}

export interface QAFile {
	metadata: QAMetadata;
	questions: QAQuestion[];
}

export interface QuestionState {
	selectedOption: string | null;
	isCorrect: boolean | null;
	showHint: boolean;
	showExplanation: boolean;
	isSubmitted: boolean;
	showDiagram: boolean;
}
