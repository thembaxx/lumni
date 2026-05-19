import { beforeEach, describe, expect, mock, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Question } from "@/lib/question-engine/types";
import type { VisualContent } from "@/lib/visual-engine/types";

const mockApiFetch = mock<(url: string, options: RequestInit) => unknown>();
const mockShowBudgetToast = mock<(error: unknown) => void>();

mock.module("@/lib/shared/api-fetch", () => ({
	apiFetch: mockApiFetch,
	isBudgetExceeded: (err: unknown) =>
		err instanceof Error &&
		"limitReached" in err &&
		(err as Record<string, unknown>).limitReached === true,
	showBudgetToast: mockShowBudgetToast,
}));

const { useVisualEngine } = await import("@/hooks/use-visual-engine");

const mockVisual: VisualContent = {
	type: "konva-diagram",
	label: "Force diagram",
	diagramType: "force-vector",
	diagramData: { objects: [] },
};

const testQuestion: Question = {
	id: "q1",
	type: "multiple-choice",
	subject: "physical-sciences",
	topic: "newtons-laws",
	difficulty: "Medium",
	bloomTaxonomy: "apply",
	points: 10,
	questionText: "Draw a force diagram?",
	hint: "Consider forces",
	explanation: "Newton's laws",
	body: {
		options: [
			{ id: "A", text: "Option A", isCorrect: true },
			{ id: "B", text: "Option B", isCorrect: false },
		],
		correctOptionId: "A",
		allowMultiple: false,
	},
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

describe("useVisualEngine", () => {
	beforeEach(() => {
		mockApiFetch.mockReset();
		mockShowBudgetToast.mockReset();
	});

	test("null question disables the query", () => {
		const { result } = renderHook(() => useVisualEngine(null), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(false);
		expect(result.current.data).toBeUndefined();
		expect(mockApiFetch).not.toHaveBeenCalled();
	});

	test("valid question fetches visual data", async () => {
		mockApiFetch.mockResolvedValue({ visual: mockVisual });

		const { result } = renderHook(() => useVisualEngine(testQuestion), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		expect(mockApiFetch).toHaveBeenCalledWith(
			"/api/engine/visual",
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining(testQuestion.id),
			}),
		);
		expect(result.current.data).toEqual(mockVisual);
	});

	test("sends correct body fields", async () => {
		mockApiFetch.mockResolvedValue({ visual: mockVisual });

		const { result } = renderHook(() => useVisualEngine(testQuestion), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isLoading).toBe(false));

		const callBody = JSON.parse(
			(mockApiFetch.mock.calls[0][1] as RequestInit).body as string,
		);
		expect(callBody.questionId).toBe(testQuestion.id);
		expect(callBody.questionText).toBe(testQuestion.questionText);
		expect(callBody.subject).toBe(testQuestion.subject);
		expect(callBody.topic).toBe(testQuestion.topic);
	});

	test("budget exceeded shows toast", async () => {
		const budgetError = new Error("Budget exceeded");
		(budgetError as Record<string, unknown>).status = 429;
		(budgetError as Record<string, unknown>).limitReached = true;

		mockApiFetch.mockRejectedValue(budgetError);

		const { result } = renderHook(() => useVisualEngine(testQuestion), {
			wrapper: createWrapper(),
		});

		await waitFor(
			() => expect(result.current.failureCount).toBeGreaterThanOrEqual(1),
			{ timeout: 3000 },
		);

		expect(mockShowBudgetToast).toHaveBeenCalled();
	});
});
