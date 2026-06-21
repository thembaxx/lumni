import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	GenerationParams,
	GradingResult,
	Question,
	UserAnswer,
} from "@/lib/question-engine/types";

const mockApiFetch = vi.fn<(url: string, options: RequestInit) => unknown>();
const mockShowBudgetToast = vi.fn<(error: unknown) => void>();

vi.mock("@/lib/shared/api-fetch", () => ({
	apiFetch: mockApiFetch,
	budgetFetch: async (url: string, options: RequestInit) => {
		try {
			return await mockApiFetch(url, options);
		} catch (error) {
			if (
				error instanceof Error &&
				"limitReached" in error &&
				(error as Record<string, unknown>).limitReached === true
			) {
				mockShowBudgetToast(error);
			}
			throw error;
		}
	},
	isBudgetExceeded: (err: unknown) =>
		err instanceof Error &&
		"limitReached" in err &&
		(err as Record<string, unknown>).limitReached === true,
	showBudgetToast: mockShowBudgetToast,
}));

vi.mock("@/lib/shared/logger", () => ({
	logError: vi.fn(),
}));

const { useQuestionEngine } = await import("@/hooks/use-question-engine");

const mockQuestion: Question = {
	id: "q1",
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

const mockGradingResult: GradingResult = {
	correct: true,
	score: 10,
	maxScore: 10,
	feedback: "Correct!",
};

function createWrapper() {
	const qc = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: Infinity },
			mutations: { retry: false },
		},
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
	};
}

describe("useQuestionEngine", () => {
	beforeEach(() => {
		mockApiFetch.mockReset();
		mockShowBudgetToast.mockReset();
	});

	test("initial state when disabled", () => {
		const { result } = renderHook(
			() => useQuestionEngine(undefined, { enabled: false }),
			{ wrapper: createWrapper() },
		);

		expect(result.current.questions).toEqual([]);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.isGenerating).toBe(false);
		expect(result.current.isGrading).toBe(false);
		expect(result.current.isGeneratingHint).toBe(false);
	});

	test("generate mutation calls POST /api/engine/generate and returns questions", async () => {
		const params: GenerationParams = {
			subject: "mathematics",
			count: 1,
		};
		mockApiFetch.mockResolvedValue({
			questions: [mockQuestion],
			count: 1,
			type: "multiple-choice",
		});

		const { result } = renderHook(() => useQuestionEngine(params), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			const questions = await result.current.generate(params);
			expect(questions).toEqual([mockQuestion]);
		});

		expect(mockApiFetch).toHaveBeenCalledWith(
			"/api/engine/generate",
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining("mathematics"),
			}),
		);

		await waitFor(() => {
			expect(result.current.questions).toEqual([mockQuestion]);
		});
	});

	test("grade mutation calls POST /api/engine/grade", async () => {
		mockApiFetch.mockResolvedValue(mockGradingResult);

		const { result } = renderHook(() => useQuestionEngine(), {
			wrapper: createWrapper(),
		});

		const answer: UserAnswer = { type: "option-ids", value: ["B"] };

		await act(async () => {
			const gradeResult = await result.current.grade(mockQuestion, answer);
			expect(gradeResult).toEqual(mockGradingResult);
		});

		expect(mockApiFetch).toHaveBeenCalledWith(
			"/api/engine/grade",
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining("q1"),
			}),
		);
	});

	test("hint mutation calls POST /api/engine/hint", async () => {
		mockApiFetch.mockResolvedValue({ hint: "Think about basic addition" });

		const { result } = renderHook(() => useQuestionEngine(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			const hint = await result.current.hint(mockQuestion);
			expect(hint).toBe("Think about basic addition");
		});

		expect(mockApiFetch).toHaveBeenCalledWith(
			"/api/engine/hint",
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining("q1"),
			}),
		);
	});

	test("budget exceeded error triggers showBudgetToast", async () => {
		const budgetError = new Error("Daily limit reached");
		(budgetError as Record<string, unknown>).status = 429;
		(budgetError as Record<string, unknown>).limitReached = true;

		mockApiFetch.mockRejectedValue(budgetError);

		const { result } = renderHook(() => useQuestionEngine(), {
			wrapper: createWrapper(),
		});

		const params: GenerationParams = {
			subject: "mathematics",
			count: 1,
		};

		await act(async () => {
			await expect(result.current.generate(params)).rejects.toThrow(
				"Daily limit reached",
			);
		});

		expect(mockShowBudgetToast).toHaveBeenCalled();
	});
});
