import { describe, expect, test } from "bun:test";
import { PromptManager } from "../prompt-manager";

describe("PromptManager", () => {
	const pm = new PromptManager();

	test("returns prompt for multiple-choice", () => {
		const p = pm.getPrompt("multiple-choice", { subject: "math", count: 5 });
		expect(p.system).toContain("MCQ");
		expect(p.user).toContain("math");
		expect(p.user).toContain("multiple-choice");
	});

	test("returns prompt for calculation", () => {
		const p = pm.getPrompt("calculation", { subject: "physics", count: 3 });
		expect(p.system).toContain("calculation");
		expect(p.user).toContain("LaTeX");
	});

	test("returns hint prompt for any type", () => {
		const p = pm.getHintPrompt("multiple-choice");
		expect(p.system).toContain("tutor");
	});

	test("returns grade prompt for essay", () => {
		const p = pm.getGradePrompt("essay");
		expect(p.system).toContain("essay grader");
	});

	test("returns grade prompt for programming", () => {
		const p = pm.getGradePrompt("programming");
		expect(p.system).toContain("code reviewer");
	});

	test("falls back to short-answer for unknown grade type", () => {
		const p = pm.getGradePrompt("mixed" as never);
		expect(p).toBeDefined();
	});

	test("handles 'any' type prompt", () => {
		const p = pm.getPrompt("any", { subject: "biology", count: 10 });
		expect(p.system).toContain("diverse mix");
	});

	test("includes topic and difficulty in user prompt", () => {
		const p = pm.getPrompt("multiple-choice", {
			subject: "chemistry",
			topic: "periodic table",
			count: 5,
			difficulty: "Hard",
		});
		expect(p.user).toContain("periodic table");
		expect(p.user).toContain("Hard");
	});
});
