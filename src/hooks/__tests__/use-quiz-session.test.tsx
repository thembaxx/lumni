import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { Question } from "@/lib/question-engine/types";

let _mockedQuestions: Question[] = [];
let _mockedIsLoading = false;
let capturedIntervalCallback: (() => void) | null = null;

const mockQuestionEngineResult = {
	questions: [] as Question[],
	isLoading: false,
	generate: mock(() => Promise.resolve([] as Question[])),
	grade: mock(() => Promise.resolve({})),
	hint: mock(() => Promise.resolve("")),
	isGenerating: false,
	isGrading: false,
	gradeResult: null as unknown,
	gradeError: null as unknown,
	isGeneratingHint: false,
	hintResult: undefined as string | undefined,
	hintError: null as unknown,
	count: 0,
	error: null as unknown,
	isError: false,
	refetch: mock(() => Promise.resolve({} as unknown)),
};

mock.module("@/hooks/use-question-engine", () => ({
	useQuestionEngine: () => mockQuestionEngineResult,
}));

mock.module("@/hooks/use-interval", () => ({
	useInterval: (callback: () => void) => {
		capturedIntervalCallback = callback;
	},
	useTimer: () => ({
		timeLeft: 30,
		isRunning: false,
		start: mock(() => {}),
		stop: mock(() => {}),
		reset: mock(() => {}),
		setTimeLeft: mock(() => {}),
	}),
}));

const { useQuizSession } = await import("@/hooks/use-quiz-session");

const questionA: Question = {
	id: "qa",
	type: "multiple-choice",
	subject: "mathematics",
	topic: "algebra",
	difficulty: "Medium",
	bloomTaxonomy: "apply",
	points: 10,
	questionText: "What is 2+2?",
	hint: "Think about addition",
	explanation: "2+2 = 4",
	body: {
		options: [
			{ id: "A", text: "3", isCorrect: false },
			{ id: "B", text: "4", isCorrect: true },
		],
		correctOptionId: "B",
		allowMultiple: false,
	},
};

const questionB: Question = {
	id: "qb",
	type: "multiple-choice",
	subject: "mathematics",
	topic: "algebra",
	difficulty: "Medium",
	bloomTaxonomy: "apply",
	points: 10,
	questionText: "What is 3+3?",
	hint: "Addition",
	explanation: "3+3 = 6",
	body: {
		options: [
			{ id: "A", text: "5", isCorrect: false },
			{ id: "B", text: "6", isCorrect: true },
		],
		correctOptionId: "B",
		allowMultiple: false,
	},
};

describe("useQuizSession", () => {
	beforeEach(() => {
		_mockedQuestions = [];
		_mockedIsLoading = false;
		capturedIntervalCallback = null;
		mockQuestionEngineResult.questions = [];
		mockQuestionEngineResult.isLoading = false;
		mockQuestionEngineResult.count = 0;
		mockQuestionEngineResult.generate.mockReset();
		mockQuestionEngineResult.grade.mockReset();
		mockQuestionEngineResult.hint.mockReset();
		mockQuestionEngineResult.refetch.mockReset();
	});

	test("initial state defaults", () => {
		const { result } = renderHook(() => useQuizSession());

		expect(result.current.state.isRunning).toBe(false);
		expect(result.current.state.elapsedTime).toBe(0);
		expect(result.current.state.currentQuestionIndex).toBe(0);
		expect(result.current.state.correctAnswers).toBe(0);
		expect(result.current.state.questions).toEqual([]);
		expect(result.current.state.currentQuestion).toBeUndefined();
		expect(result.current.state.hasSubject).toBe(false);
	});

	test("handleStart sets isRunning and resets state", () => {
		mockQuestionEngineResult.questions = [questionA, questionB];
		mockQuestionEngineResult.count = 2;

		const { result } = renderHook(() => useQuizSession());

		act(() => {
			result.current.actions.handleStart();
		});

		expect(result.current.state.isRunning).toBe(true);
		expect(result.current.state.currentQuestionIndex).toBe(0);
		expect(result.current.state.correctAnswers).toBe(0);
		expect(result.current.state.elapsedTime).toBe(0);
	});

	test("handleNext advances index", () => {
		mockQuestionEngineResult.questions = [questionA, questionB];
		mockQuestionEngineResult.count = 2;

		const { result } = renderHook(() => useQuizSession());

		act(() => result.current.actions.handleStart());
		expect(result.current.state.currentQuestionIndex).toBe(0);

		act(() => result.current.actions.handleNext());
		expect(result.current.state.currentQuestionIndex).toBe(1);

		expect(result.current.state.currentQuestion).toEqual(questionB);
	});

	test("handleNext calls handleStop on last question", () => {
		mockQuestionEngineResult.questions = [questionA];
		mockQuestionEngineResult.count = 1;

		const onFinish = mock(() => {});
		const { result } = renderHook(() => useQuizSession({ onFinish }));

		act(() => result.current.actions.handleStart());
		act(() => result.current.actions.handleNext());

		expect(result.current.state.isRunning).toBe(false);
		expect(onFinish).toHaveBeenCalled();
	});

	test("handlePrevious decrements index", () => {
		mockQuestionEngineResult.questions = [questionA, questionB];
		mockQuestionEngineResult.count = 2;

		const { result } = renderHook(() => useQuizSession());
		act(() => result.current.actions.handleStart());
		act(() => result.current.actions.handleNext());

		expect(result.current.state.currentQuestionIndex).toBe(1);

		act(() => result.current.actions.handlePrevious());
		expect(result.current.state.currentQuestionIndex).toBe(0);
	});

	test("handlePrevious does not go below 0", () => {
		mockQuestionEngineResult.questions = [questionA, questionB];
		mockQuestionEngineResult.count = 2;

		const { result } = renderHook(() => useQuizSession());
		act(() => result.current.actions.handleStart());

		act(() => result.current.actions.handlePrevious());
		expect(result.current.state.currentQuestionIndex).toBe(0);
	});

	test("handleSkip delegates to handleNext", () => {
		const questionC: Question = {
			...questionA,
			id: "qc",
			questionText: "What is 4+4?",
		};
		mockQuestionEngineResult.questions = [questionA, questionB, questionC];
		mockQuestionEngineResult.count = 3;

		const { result } = renderHook(() => useQuizSession());
		act(() => result.current.actions.handleStart());
		act(() => result.current.actions.handleNext());
		act(() => result.current.actions.handleSkip());

		expect(result.current.state.currentQuestionIndex).toBe(2);
	});

	test("handleStop calls onFinish with correctAnswers and elapsedTime", () => {
		mockQuestionEngineResult.questions = [questionA, questionB];
		mockQuestionEngineResult.count = 2;

		const onFinish = mock(() => {});
		const { result } = renderHook(() => useQuizSession({ onFinish }));

		act(() => result.current.actions.handleStart());
		act(() => result.current.actions.handleStop());

		expect(onFinish).toHaveBeenCalledWith(
			expect.objectContaining({
				correctAnswers: 0,
				elapsedTime: 0,
			}),
		);
	});

	test("handleStartWithSubject sets subject", () => {
		mockQuestionEngineResult.questions = [questionA];
		mockQuestionEngineResult.count = 1;

		const { result } = renderHook(() => useQuizSession());

		expect(result.current.state.selectedSubject).toBe("");

		act(() => {
			result.current.actions.handleStartWithSubject("mathematics");
		});

		expect(result.current.state.selectedSubject).toBe("mathematics");
	});

	test("handleRestart resets state and starts running", () => {
		mockQuestionEngineResult.questions = [questionA, questionB];
		mockQuestionEngineResult.count = 2;

		const { result } = renderHook(() => useQuizSession());
		act(() => result.current.actions.handleStart());
		act(() => result.current.actions.handleNext());

		act(() => result.current.actions.handleRestart());

		expect(result.current.state.isRunning).toBe(true);
		expect(result.current.state.currentQuestionIndex).toBe(0);
		expect(result.current.state.elapsedTime).toBe(0);
	});

	test("reset sets isRunning false and zeroes state", () => {
		mockQuestionEngineResult.questions = [questionA, questionB];
		mockQuestionEngineResult.count = 2;

		const { result } = renderHook(() => useQuizSession());
		act(() => result.current.actions.handleStart());
		act(() => result.current.actions.handleNext());

		act(() => result.current.actions.reset());

		expect(result.current.state.isRunning).toBe(false);
		expect(result.current.state.elapsedTime).toBe(0);
		expect(result.current.state.currentQuestionIndex).toBe(0);
		expect(result.current.state.correctAnswers).toBe(0);
	});

	test("maxTime reached auto-stops and calls onFinish", () => {
		mockQuestionEngineResult.questions = [questionA, questionB];
		mockQuestionEngineResult.count = 2;

		const onFinish = mock(() => {});
		const { result } = renderHook(() =>
			useQuizSession({ maxTime: 5, onFinish }),
		);

		act(() => result.current.actions.handleStart());
		expect(result.current.state.isRunning).toBe(true);

		// Simulate elapsed time reaching maxTime via interval callback
		if (capturedIntervalCallback) {
			// Fire enough times to exceed maxTime (5)
			for (let i = 0; i < 6; i++) {
				act(() => {
					capturedIntervalCallback!();
				});
			}
		}

		expect(onFinish).toHaveBeenCalledWith(
			expect.objectContaining({
				elapsedTime: 5,
			}),
		);
	});
});
