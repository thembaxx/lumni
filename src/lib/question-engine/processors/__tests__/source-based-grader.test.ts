import { describe, expect, test } from "bun:test";
import { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { grade } from "../graders/source-based";

const prompts = new PromptManager();

function makeQuestion(
	overrides?: Partial<Question<"source-based">>,
): Question<"source-based"> {
	return {
		id: "q1",
		type: "source-based",
		subject: "history",
		topic: "cold-war",
		difficulty: "Hard",
		bloomTaxonomy: "analyze",
		points: 12,
		questionText: "Analyze the source about the Berlin Wall",
		hint: "Consider the author's perspective",
		explanation: "The source shows the division of Berlin",
		body: {
			source: {
				type: "text",
				content: "The Berlin Wall stood as a symbol of Cold War division...",
			},
			subQuestions: [
				{
					id: "sq1",
					questionText: "When was the wall built?",
					type: "short-answer",
					points: 4,
					body: {
						modelAnswer: "1961",
						acceptableAnswers: ["1961"],
						maxLength: 50,
					},
				},
				{
					id: "sq2",
					questionText: "Why was it built?",
					type: "short-answer",
					points: 8,
					body: {
						modelAnswer: "To stop defections",
						acceptableAnswers: ["To stop defections", "prevent escape"],
						maxLength: 200,
					},
				},
			],
		},
		...overrides,
	};
}

describe("Source-based Grader", () => {
	test("empty answer is handled", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "text", value: "" }, prompts);
		expect(result.correct).toBe(false);
		expect(result.feedback).toContain("No answer");
	});
});
