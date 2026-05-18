import { describe, expect, test, mock, beforeEach } from "bun:test";
import type { FlashcardSM2 } from "@/lib/flashcard-repository/types";
import type { Question } from "@/lib/question-engine/types";

const createMock = mock(async (_front: string, _back: string, _subject: string, _topic?: string) => ({
	id: "fc_new",
	front: _front,
	back: _back,
	subject: _subject,
	topic: _topic,
	easeFactor: 2.5,
	interval: 0,
	repetitions: 0,
	nextReview: Date.now(),
	lastReview: null,
	createdAt: Date.now(),
}));

const updateMock = mock(async (_id: string, _updates: Partial<FlashcardSM2>) => {});

let mockCards: FlashcardSM2[] = [];

mock.module("@/lib/flashcard-repository", () => ({
	flashcardRepository: {
		getAll: async () => [...mockCards],
		create: createMock,
		update: updateMock,
	},
}));

const { SpacedRepService } = await import("../spaced-rep-service");

function makeQuestion(overrides: Partial<Question> = {}): Question {
	return {
		id: "q1",
		type: "multiple-choice",
		subject: "mathematics",
		topic: "algebra",
		difficulty: "Medium",
		bloomTaxonomy: "apply",
		points: 10,
		questionText: "What is 2+2?",
		explanation: "2+2 = 4",
		body: {
			options: [
				{ id: "A", text: "3", isCorrect: false },
				{ id: "B", text: "4", isCorrect: true },
				{ id: "C", text: "5", isCorrect: false },
			],
			correctOptionId: "B",
			allowMultiple: false,
		},
		...overrides,
	};
}

describe("SpacedRepService", () => {
	const service = new SpacedRepService();

	beforeEach(() => {
		mockCards = [];
		createMock.mockReset();
		updateMock.mockReset();
	});

	describe("update", () => {
		test("creates new flashcard when no existing card found", async () => {
			const question = makeQuestion();
			await service.update(question, { correct: true, score: 1 });
			expect(createMock).toHaveBeenCalledTimes(1);
			expect(createMock).toHaveBeenCalledWith(
				"What is 2+2?",
				"4",
				"mathematics",
				"algebra",
			);
		});

		test("creates with explanation when no correct answer extractable", async () => {
			const question = makeQuestion({
				type: "essay",
				body: { rubric: [{ criterion: "a", maxScore: 5 }], modelAnswer: "42" },
			});
			await service.update(question, { correct: true, score: 0.8 });
			expect(createMock).toHaveBeenCalledWith(
				"What is 2+2?",
				"42",
				"mathematics",
				"algebra",
			);
		});

		test("updates existing card with new SM-2 values", async () => {
			mockCards = [{
				id: "fc_existing",
				front: "What is 2+2?",
				back: "4",
				subject: "mathematics",
				topic: "algebra",
				easeFactor: 2.5,
				interval: 6,
				repetitions: 2,
				nextReview: Date.now(),
				lastReview: Date.now(),
				createdAt: Date.now(),
			}];

			await service.update(makeQuestion(), { correct: true, score: 0.95 });
			expect(updateMock).toHaveBeenCalledTimes(1);
			const updateArg = updateMock.mock.calls[0];
			expect(updateArg[0]).toBe("fc_existing");
			expect((updateArg[1] as FlashcardSM2).repetitions).toBe(3);
			expect((updateArg[1] as FlashcardSM2).interval).toBeGreaterThan(0);
		});

		test("does not create duplicate when card already exists", async () => {
			mockCards = [{
				id: "fc_existing",
				front: "What is 2+2?",
				back: "4",
				subject: "mathematics",
				topic: "algebra",
				easeFactor: 2.5,
				interval: 0,
				repetitions: 0,
				nextReview: Date.now(),
				lastReview: null,
				createdAt: Date.now(),
			}];

			await service.update(makeQuestion(), { correct: false, score: 0.2 });
			expect(createMock).not.toHaveBeenCalled();
			expect(updateMock).toHaveBeenCalledTimes(1);
		});

		test("quality 5 for near-perfect correct answers", async () => {
			mockCards = [{
				id: "fc_q",
				front: "What is 2+2?",
				back: "4",
				subject: "mathematics",
				topic: "algebra",
				easeFactor: 2.5,
				interval: 0,
				repetitions: 0,
				nextReview: Date.now(),
				lastReview: null,
				createdAt: Date.now(),
			}];

			await service.update(makeQuestion(), { correct: true, score: 0.95 });
			const updates = updateMock.mock.calls[0][1] as FlashcardSM2;
			expect(updates.easeFactor).toBeGreaterThan(2.5);
		});

		test("quality 0 for complete blackout", async () => {
			mockCards = [{
				id: "fc_q0",
				front: "What is 2+2?",
				back: "4",
				subject: "mathematics",
				topic: "algebra",
				easeFactor: 2.5,
				interval: 0,
				repetitions: 0,
				nextReview: Date.now(),
				lastReview: null,
				createdAt: Date.now(),
			}];

			await service.update(makeQuestion(), { correct: false, score: 0 });
			const updates = updateMock.mock.calls[0][1] as FlashcardSM2;
			expect(updates.repetitions).toBe(0);
			expect(updates.interval).toBe(1);
		});
	});
});

const { extractCorrectAnswer } = await import("../spaced-rep-service");

describe("extractCorrectAnswer", () => {

	test("extracts from MCQ options", () => {
		const q = makeQuestion();
		expect(extractCorrectAnswer(q)).toBe("4");
	});

	test("extracts from modelAnswer", () => {
		const q = makeQuestion({
			type: "short-answer",
			body: { modelAnswer: "42", acceptableAlternatives: ["forty-two"] },
		});
		expect(extractCorrectAnswer(q)).toBe("42");
	});

	test("extracts from correctValue as string", () => {
		const q = makeQuestion({
			type: "calculation",
			body: { formula: "F=ma", correctValue: 50, unit: "N", tolerance: 0.1 },
		});
		expect(extractCorrectAnswer(q)).toBe("50");
	});

	test("returns null for unextractable answers", () => {
		const q = makeQuestion({
			type: "essay",
			body: { rubric: [{ criterion: "a", maxScore: 5 }] },
		});
		expect(extractCorrectAnswer(q)).toBeNull();
	});

	test("returns null when no correct option in MCQ", () => {
		const q = makeQuestion({
			body: { options: [{ id: "A", text: "3", isCorrect: false }], correctOptionId: "A", allowMultiple: false },
		});
		expect(extractCorrectAnswer(q)).toBeNull();
	});
});
