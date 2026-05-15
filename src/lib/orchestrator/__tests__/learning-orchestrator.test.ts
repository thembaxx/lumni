import { describe, expect, test } from "bun:test";
import { QuestionEngine } from "@/lib/question-engine/question-engine";
import { LearningOrchestrator } from "../learning-orchestrator";

describe("LearningOrchestrator", () => {
	test("composes QuestionEngine", () => {
		const engine = new QuestionEngine();
		const orchestrator = new LearningOrchestrator(engine);
		expect(orchestrator).toBeDefined();
	});
});
