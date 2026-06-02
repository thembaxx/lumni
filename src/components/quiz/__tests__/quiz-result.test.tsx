import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { QuizResult } from "@/components/quiz/quiz-result";

function hasText(container: HTMLElement, regex: RegExp): boolean {
	return regex.test(container.textContent ?? "");
}

describe("QuizResult", () => {
	afterEach(() => {
		cleanup();
	});

	test("renders VerifiedByPill with sources when provided", () => {
		const { container } = render(
			<QuizResult
				results={{
					totalQuestions: 10,
					correctAnswers: 7,
					accuracy: 70,
					incorrectAnswers: [],
				}}
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
			<QuizResult
				results={{
					totalQuestions: 10,
					correctAnswers: 7,
					accuracy: 70,
					incorrectAnswers: [],
				}}
				sources={[{ url: "https://www.education.gov.za/", title: "DBE" }]}
				onRestart={() => {}}
			/>,
		);

		expect(hasText(container, /Verified by 1 web source(?!s)/)).toBe(true);
	});

	test("does not render VerifiedByPill when sources is empty", () => {
		const { container } = render(
			<QuizResult
				results={{
					totalQuestions: 10,
					correctAnswers: 7,
					accuracy: 70,
					incorrectAnswers: [],
				}}
				sources={[]}
				onRestart={() => {}}
			/>,
		);

		expect(hasText(container, /Verified by \d+ web source/)).toBe(false);
	});

	test("does not render VerifiedByPill when sources is undefined", () => {
		const { container } = render(
			<QuizResult
				results={{
					totalQuestions: 10,
					correctAnswers: 7,
					accuracy: 70,
					incorrectAnswers: [],
				}}
				onRestart={() => {}}
			/>,
		);

		expect(hasText(container, /Verified by \d+ web source/)).toBe(false);
	});
});
