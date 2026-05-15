import { describe, expect, test } from "bun:test";
import { QuestionEngine } from "../question-engine";
import type { Question } from "../types";

describe("QuestionEngine", () => {
	test("listTypes returns all registered types", () => {
		const engine = new QuestionEngine();
		const types = engine.listTypes();
		expect(types.length).toBeGreaterThanOrEqual(10);
		expect(types).toContain("multiple-choice");
		expect(types).toContain("short-answer");
		expect(types).toContain("calculation");
		expect(types).toContain("essay");
		expect(types).toContain("mixed");
	});

	test("validate returns result for a valid multiple-choice question", () => {
		const engine = new QuestionEngine();
		const question: Question<"multiple-choice"> = {
			id: "q1",
			type: "multiple-choice",
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

		const result = engine.validate(question);
		expect(result.isValid).toBe(true);
		expect(result.score).toBeGreaterThan(0);
	});

	test("validate flags question with empty text as not valid", () => {
		const engine = new QuestionEngine();
		const question = {
			id: "q-bad",
			type: "multiple-choice",
			subject: "math",
			topic: "algebra",
			difficulty: "Easy",
			bloomTaxonomy: "remember",
			points: 10,
			questionText: "",
			hint: "",
			explanation: "",
			body: {
				options: [],
				correctOptionId: "",
				allowMultiple: false,
			},
		} as Question;

		const result = engine.validate(question);
		expect(result.isValid).toBe(false);
	});
});

describe("LearningOrchestrator delegation", () => {
	test("orchestrator composes QuestionEngine via delegate methods", async () => {
		const { LearningOrchestrator } = await import(
			"@/lib/orchestrator/learning-orchestrator"
		);

		const orchestrator = await LearningOrchestrator.initialize();
		const engine = new QuestionEngine();

		const orchestratorTypes = orchestrator.listTypes();
		const engineTypes = engine.listTypes();

		expect(orchestratorTypes).toEqual(engineTypes);
	});

	test("validate delegates to QuestionEngine", async () => {
		const { LearningOrchestrator } = await import(
			"@/lib/orchestrator/learning-orchestrator"
		);

		const orchestrator = await LearningOrchestrator.initialize();
		const engine = new QuestionEngine();

		const question: Question<"multiple-choice"> = {
			id: "q1",
			type: "multiple-choice",
			subject: "math",
			topic: "algebra",
			difficulty: "Easy",
			bloomTaxonomy: "remember",
			points: 10,
			questionText: "Test question?",
			hint: "hint",
			explanation: "exp",
			body: {
				options: [
					{ id: "A", text: "1", isCorrect: false },
					{ id: "B", text: "2", isCorrect: true },
				],
				correctOptionId: "B",
				allowMultiple: false,
			},
		};

		const orchestratorResult = orchestrator.validate(question);
		const engineResult = engine.validate(question);

		expect(orchestratorResult.isValid).toBe(engineResult.isValid);
		expect(orchestratorResult.score).toBe(engineResult.score);
	});
});
