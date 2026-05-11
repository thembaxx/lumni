import type { Question } from "@/types/questions";

export interface ExamQuestion {
	id: string;
	questionNumber: number;
	questionText: string;
	options?: string[];
	correctAnswer?: string;
	marking?: string;
	subQuestion?: string[];
}

export interface ExamPaperQuizOptions {
	paperId: string;
	subject: string;
	year: number;
	paperNumber: number;
	questions: ExamQuestion[];
	questionCount?: number;
	shuffle?: boolean;
}

export function convertExamPaperToQuiz({
	paperId,
	subject,
	year,
	paperNumber,
	questions,
	questionCount = 20,
	shuffle = true,
}: ExamPaperQuizOptions): Question<"multiple-choice">[] {
	const quizQuestions: Question<"multiple-choice">[] = [];

	let selectedQuestions = [...questions];

	if (questionCount && questionCount < selectedQuestions.length) {
		selectedQuestions = selectedQuestions.slice(0, questionCount);
	}

	if (shuffle) {
		selectedQuestions = shuffleArray(selectedQuestions);
	}

	for (const examQ of selectedQuestions) {
		const opts =
			examQ.options ||
			generateDefaultOptions(examQ.questionText, examQ.correctAnswer);

		const options = opts.map((text, idx) => ({
			id: String.fromCharCode(65 + idx),
			text,
			isCorrect:
				examQ.correctAnswer?.toUpperCase() === String.fromCharCode(65 + idx),
		}));

		const correctOptionId = options.find((o) => o.isCorrect)?.id ?? "A";

		const quizQuestion: Question<"multiple-choice"> = {
			id: `exam_${paperId}_q${examQ.questionNumber}`,
			type: "multiple-choice",
			subject,
			topic: `${subject} - ${year}`,
			difficulty: determineDifficulty(examQ.questionNumber, questions.length),
			bloomTaxonomy: "remember",
			points: calculatePoints(
				examQ.questionNumber,
				questions.length,
				examQ.subQuestion?.length || 1,
			),
			questionText: examQ.questionText,
			hint: "",
			explanation: examQ.marking
				? `Mark: ${examQ.marking}`
				: `Question ${examQ.questionNumber} from ${year} Paper ${paperNumber}`,
			body: {
				options,
				correctOptionId,
				allowMultiple: false,
			},
		};

		quizQuestions.push(quizQuestion);
	}

	return quizQuestions;
}

function generateDefaultOptions(
	questionText: string,
	correctAnswer?: string,
): string[] {
	const baseOptions = [
		"True",
		"False",
		"Not enough information",
		"Cannot be determined",
	];

	if (correctAnswer) {
		return baseOptions.map((opt) =>
			opt === correctAnswer ? correctAnswer : opt,
		);
	}

	return baseOptions;
}

function determineDifficulty(
	questionNumber: number,
	totalQuestions: number,
): "Easy" | "Medium" | "Hard" {
	const progress = questionNumber / totalQuestions;
	if (progress < 0.33) return "Easy";
	if (progress < 0.66) return "Medium";
	return "Hard";
}

function calculatePoints(
	questionNumber: number,
	totalQuestions: number,
	subQuestions: number,
): number {
	const basePoints = Math.ceil(100 / totalQuestions);
	return basePoints * Math.min(subQuestions, 3);
}

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export interface QuizFromExamOptions {
	examPaperId: string;
	filterBy?: {
		year?: number;
		paperNumber?: number;
		questionType?: string;
	};
	excludeAnswered?: boolean;
}

export function getEligibleExamQuestions(
	questions: ExamQuestion[],
	options: QuizFromExamOptions,
): ExamQuestion[] {
	let filtered = [...questions];

	if (options.filterBy?.year) {
		filtered = filtered.filter((q) => q.questionNumber <= 30);
	}

	if (options.excludeAnswered) {
		const answeredIds = JSON.parse(
			localStorage.getItem("lumni_answered_exam_questions") || "[]",
		) as string[];
		filtered = filtered.filter((q) => !answeredIds.includes(q.id));
	}

	return filtered;
}

export function markExamQuestionAsAnswered(questionId: string): void {
	const answered = JSON.parse(
		localStorage.getItem("lumni_answered_exam_questions") || "[]",
	) as string[];

	if (!answered.includes(questionId)) {
		answered.push(questionId);
		localStorage.setItem(
			"lumni_answered_exam_questions",
			JSON.stringify(answered),
		);
	}
}
