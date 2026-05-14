import { describe, expect, test } from "bun:test";
import { grade } from "../graders/diagram";
import { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";

const prompts = new PromptManager();

function makeQuestion(overrides?: Partial<Question<"diagram">>): Question<"diagram"> {
	return {
		id: "q1",
		type: "diagram",
		subject: "physical-sciences",
		topic: "forces",
		difficulty: "Medium",
		bloomTaxonomy: "understand",
		points: 8,
		questionText: "Label the forces on this diagram",
		hint: "Identify all force vectors",
		explanation: "Forces include gravity, normal, and friction",
		body: {
			diagramData: { type: "force-vector", title: "Forces on a block", data: {} },
			instructions: "Label each force arrow with its name",
		},
		...overrides,
	};
}

describe("Diagram Grader", () => {
	test("empty answer is handled", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "text", value: "" }, prompts);
		expect(result.correct).toBe(false);
		expect(result.feedback).toContain("No answer");
	});

	test("null answer is handled", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "text", value: null }, prompts);
		expect(result.correct).toBe(false);
		expect(result.feedback).toContain("No answer");
	});
});
