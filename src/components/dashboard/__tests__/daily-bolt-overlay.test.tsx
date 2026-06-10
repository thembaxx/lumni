import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { Question } from "@/lib/question-engine/types";

function hasText(container: HTMLElement, regex: RegExp): boolean {
	return regex.test(container.textContent ?? "");
}

const mockUseQuestionEngine = vi.fn(
	(): {
		questions: Question[];
		isLoading: boolean;
		count: number;
		sources: { url: string; title: string }[];
	} => ({
		questions: [],
		isLoading: false,
		count: 0,
		sources: [],
	}),
);

// Mock useQuestionEngine at the hook boundary so we don't depend on
// @/lib/shared/api-fetch (which gets stale-cached by other test files
// in bun's sequential mode).
vi.mock("@/hooks/use-question-engine", () => ({
	useQuestionEngine: mockUseQuestionEngine,
}));

vi.mock("@/i18n/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	usePathname: () => "/",
	Link: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
	useFormatter: () => ({ dateTime: (d: Date) => d.toISOString() }),
}));

const { DailyBoltOverlay } = await import(
	"@/components/dashboard/daily-bolt-overlay"
);
const { __setDepsForTesting } = await import(
	"@/components/dashboard/daily-bolt-overlay-deps"
);

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

const MOCK_QUESTION: Question = {
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

describe("DailyBoltOverlay", () => {
	afterEach(() => {
		cleanup();
	});

	test("renders header and skip button on mount", () => {
		mockUseQuestionEngine.mockReturnValue({
			questions: [MOCK_QUESTION],
			isLoading: false,
			count: 1,
			sources: [],
		});
		const { container } = render(
			<DailyBoltOverlay onComplete={() => {}} onSkip={() => {}} streak={1} />,
			{ wrapper: createWrapper() },
		);
		expect(hasText(container, /Today/)).toBe(true);
		expect(hasText(container, /Bolt/)).toBe(true);
		const buttons = container.getElementsByTagName("button");
		expect(buttons.length).toBeGreaterThan(0);
	});

	test("shows empty state when no questions returned", async () => {
		mockUseQuestionEngine.mockReturnValue({
			questions: [],
			isLoading: false,
			count: 0,
			sources: [],
		});
		__setDepsForTesting({
			db: { competencies: { toArray: async () => [] } } as never,
		});

		const { container } = render(
			<DailyBoltOverlay onComplete={() => {}} onSkip={() => {}} streak={1} />,
			{ wrapper: createWrapper() },
		);

		await waitFor(
			() => {
				expect(hasText(container, /No .* question ready yet/i)).toBe(true);
			},
			{ timeout: 10000 },
		);
	});

	test("skip button visible in header throughout all phases", async () => {
		mockUseQuestionEngine.mockReturnValue({
			questions: [MOCK_QUESTION],
			isLoading: false,
			count: 1,
			sources: [],
		});
		__setDepsForTesting({
			db: { competencies: { toArray: async () => [] } } as never,
		});

		const { container } = render(
			<DailyBoltOverlay onComplete={() => {}} onSkip={() => {}} streak={1} />,
			{ wrapper: createWrapper() },
		);

		const skipBtn = await waitFor(
			() => {
				const buttons = container.getElementsByTagName("button");
				return Array.from(buttons).find(
					(b) =>
						b.textContent === "Skip" || b.textContent === "Skip to Dashboard",
				);
			},
			{ timeout: 10000 },
		);
		expect(skipBtn).toBeTruthy();
	});

	test("calls onSkip when skip button clicked", async () => {
		mockUseQuestionEngine.mockReturnValue({
			questions: [MOCK_QUESTION],
			isLoading: false,
			count: 1,
			sources: [],
		});
		__setDepsForTesting({
			db: { competencies: { toArray: async () => [] } } as never,
		});

		let skipped = false;
		const { container } = render(
			<DailyBoltOverlay
				onComplete={() => {}}
				onSkip={() => {
					skipped = true;
				}}
				streak={1}
			/>,
			{ wrapper: createWrapper() },
		);

		const skipButton = await waitFor(
			() => {
				const buttons = container.getElementsByTagName("button");
				return Array.from(buttons).find(
					(b) =>
						b.textContent === "Skip" || b.textContent === "Skip to Dashboard",
				);
			},
			{ timeout: 10000 },
		);

		skipButton?.click();
		expect(skipped).toBe(true);
	});

	test("shows answering phase when question loads", async () => {
		mockUseQuestionEngine.mockReturnValue({
			questions: [MOCK_QUESTION],
			isLoading: false,
			count: 1,
			sources: [],
		});
		__setDepsForTesting({
			db: { competencies: { toArray: async () => [] } } as never,
		});

		const { container } = render(
			<DailyBoltOverlay onComplete={() => {}} onSkip={() => {}} streak={3} />,
			{ wrapper: createWrapper() },
		);

		await waitFor(
			() => {
				expect(hasText(container, /What is 2\+2\?/)).toBe(true);
			},
			{ timeout: 10000 },
		);

		expect(hasText(container, /Mathematics/)).toBe(true);
	});
});
