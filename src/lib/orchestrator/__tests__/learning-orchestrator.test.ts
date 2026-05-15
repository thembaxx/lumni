import { describe, expect, test } from "bun:test";
import { QuestionEngine } from "@/lib/question-engine/question-engine";
import { LearningOrchestrator } from "../learning-orchestrator";

describe("LearningOrchestrator", () => {
	test("composes QuestionEngine", () => {
		const engine = new QuestionEngine();
		const orchestrator = new LearningOrchestrator(engine);
		expect(orchestrator).toBeDefined();
	});

	test("listTypes delegates to engine", () => {
		const engine = new QuestionEngine();
		const orchestrator = new LearningOrchestrator(engine);
		const types = orchestrator.listTypes();
		expect(types).toContain("multiple-choice");
		expect(types).toContain("calculation");
	});

	test("validate delegates to engine", () => {
		const engine = new QuestionEngine();
		const orchestrator = new LearningOrchestrator(engine);
		const question = {
			id: "q1",
			type: "multiple-choice" as const,
			subject: "math",
			topic: "algebra",
			difficulty: "Easy",
			bloomTaxonomy: "remember",
			points: 10,
			questionText: "What is 2+2?",
			hint: "Basic arithmetic",
			explanation: "2+2=4",
			body: {
				options: [
					{ id: "A", text: "3", isCorrect: false },
					{ id: "B", text: "4", isCorrect: true },
				],
				correctOptionId: "B",
				allowMultiple: false,
			},
		};
		const result = orchestrator.validate(question);
		expect(result.isValid).toBe(true);
	});

	test("grade delegates to engine", async () => {
		const engine = new QuestionEngine();
		const orchestrator = new LearningOrchestrator(engine);
		const question = {
			id: "q1",
			type: "multiple-choice" as const,
			subject: "math",
			topic: "algebra",
			difficulty: "Easy",
			bloomTaxonomy: "remember",
			points: 10,
			questionText: "What is 2+2?",
			hint: "Basic arithmetic",
			explanation: "2+2=4",
			body: {
				options: [
					{ id: "A", text: "3", isCorrect: false },
					{ id: "B", text: "4", isCorrect: true },
				],
				correctOptionId: "B",
				allowMultiple: false,
			},
		};
		const result = await orchestrator.grade(question, { value: ["B"] });
		expect(result.correct).toBe(true);
	});
});
