import { describe, expect, test } from "bun:test";
import { grade } from "../graders/essay";
import { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";

const prompts = new PromptManager();

function makeQuestion(overrides?: Partial<Question<"essay">>): Question<"essay"> {
	return {
		id: "q1",
		type: "essay",
		subject: "history",
		topic: "cold-war",
		difficulty: "Hard",
		bloomTaxonomy: "evaluate",
		points: 25,
		questionText: "Evaluate the role of nuclear weapons in the Cold War",
		hint: "Consider deterrence theory and key crises",
		explanation: "Nuclear weapons shaped Cold War dynamics...",
		body: {
			rubric: [
				{ name: "Argument", description: "Clear thesis", maxScore: 5 },
				{ name: "Evidence", description: "Historical examples", maxScore: 5 },
				{ name: "Analysis", description: "Critical evaluation", maxScore: 5 },
			],
			modelAnswer: "Nuclear weapons played a central role in the Cold War through the doctrine of mutually assured destruction...",
			wordLimit: 1000,
		},
		...overrides,
	};
}

describe("Essay Grader", () => {
	test("fails on very short essay", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "text", value: "Too short" }, prompts);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
		expect(result.feedback).toContain("too short");
	});

	test("empty answer returns 0", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "text", value: "" }, prompts);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});
});
