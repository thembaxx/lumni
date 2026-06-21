import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
	usePathname: () => "/quiz",
	useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

vi.mock("next-intl/navigation", () => ({
	createNavigation: () => ({
		Link: ({ children, ...props }: Record<string, unknown>) => ({
			...props,
			children,
		}),
		redirect: vi.fn(),
		useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
		usePathname: () => "/quiz",
		useSearchParams: () => new URLSearchParams(),
	}),
}));

vi.mock("next-intl/server", () => ({
	getRequestConfig: vi.fn(),
}));

import { QuizResultsCard } from "@/components/quiz/quiz-results";

function hasText(container: HTMLElement, regex: RegExp): boolean {
	return regex.test(container.textContent ?? "");
}

describe("QuizResultsCard", () => {
	afterEach(() => {
		cleanup();
	});

	test("renders VerifiedByPill with sources when provided", () => {
		const { container } = render(
			<QuizResultsCard
				totalQuestions={10}
				correctAnswers={7}
				elapsedTime={120}
				subject="Mathematics"
				sources={[
					{
						url: "https://www.education.gov.za/Curriculum/",
						title: "DBE Curriculum",
					},
					{ url: "https://wced.school.za", title: "WCED Past Papers" },
				]}
				onRestart={() => {}}
			/>,
		);

		expect(hasText(container, /Verified by 2 web sources/)).toBe(true);
	});

	test("singular label when exactly one source", () => {
		const { container } = render(
			<QuizResultsCard
				totalQuestions={10}
				correctAnswers={7}
				elapsedTime={120}
				subject="Mathematics"
				sources={[{ url: "https://www.education.gov.za/", title: "DBE" }]}
				onRestart={() => {}}
			/>,
		);

		expect(hasText(container, /Verified by 1 web source(?!s)/)).toBe(true);
	});

	test("does not render VerifiedByPill when sources is empty", () => {
		const { container } = render(
			<QuizResultsCard
				totalQuestions={10}
				correctAnswers={7}
				elapsedTime={120}
				subject="Mathematics"
				sources={[]}
				onRestart={() => {}}
			/>,
		);

		expect(hasText(container, /Verified by \d+ web source/)).toBe(false);
	});

	test("does not render VerifiedByPill when sources is undefined", () => {
		const { container } = render(
			<QuizResultsCard
				totalQuestions={10}
				correctAnswers={7}
				elapsedTime={120}
				subject="Mathematics"
				onRestart={() => {}}
			/>,
		);

		expect(hasText(container, /Verified by \d+ web source/)).toBe(false);
	});

	test("renders accuracy percentage", () => {
		const { container } = render(
			<QuizResultsCard
				totalQuestions={10}
				correctAnswers={7}
				elapsedTime={120}
				subject="Mathematics"
				onRestart={() => {}}
			/>,
		);

		expect(hasText(container, /70%/)).toBe(true);
	});
});
