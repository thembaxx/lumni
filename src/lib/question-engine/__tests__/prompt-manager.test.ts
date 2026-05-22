import { describe, expect, test } from "bun:test";

const { PromptManager } = await import("../prompt-manager");

describe("PromptManager", () => {
	const promptManager = new PromptManager();

	test("getPrompt returns correct structure for 'any' type", () => {
		const params = {
			subject: "mathematics",
			count: 5,
			difficulty: "Medium",
		};
		const result = promptManager.getPrompt("any", params);
		expect(result).toHaveProperty("system");
		expect(result).toHaveProperty("user");
		expect(result.system).toContain("expert educational question generator");
		expect(result.user).toContain("Generate 5 questions for mathematics");
	});

	test("getPrompt returns correct structure for multiple-choice type", () => {
		const params = {
			subject: "physics",
			count: 3,
			difficulty: "Hard",
			topic: "mechanics",
		};
		const result = promptManager.getPrompt("multiple-choice", params);
		expect(result).toHaveProperty("system");
		expect(result).toHaveProperty("user");
		expect(result.system).toContain("expert MCQ generator");
		expect(result.user).toContain(
			"Generate 3 multiple-choice questions for physics",
		);
		expect(result.user).toContain("on the topic: mechanics");
	});

	test("getPrompt includes Bloom's taxonomy when provided", () => {
		const params = {
			subject: "biology",
			count: 2,
			difficulty: "Medium",
			bloomLevel: "analyze",
		};
		const result = promptManager.getPrompt("short-answer", params);
		expect(result.user).toContain(". Bloom's taxonomy level: analyze");
	});

	test("getPrompt includes curriculum unit when provided", () => {
		const params = {
			subject: "history",
			count: 1,
			difficulty: "Easy",
			curriculumUnit: "World War II",
		};
		const result = promptManager.getPrompt("essay", params);
		expect(result.user).toContain(". Curriculum unit: World War II");
	});

	test("getHintPrompt returns correct structure", () => {
		const result = promptManager.getHintPrompt("calculation");
		expect(result).toHaveProperty("system");
		expect(result).toHaveProperty("user");
		expect(result.system).toContain("helpful tutor");
		expect(result.user).toContain(
			"Generate a hint for this calculation question",
		);
	});

	test("getGradePrompt returns correct structure for calculation type", () => {
		const result = promptManager.getGradePrompt("calculation");
		expect(result).toHaveProperty("system");
		expect(result).toHaveProperty("user");
		expect(result.system).toContain("precise math/science grader");
		expect(result.user).toContain("Evaluate the calculation answer");
	});

	test("buildCompetencyContext returns empty string when no topicCompetencyLevel", () => {
		// @ts-expect-error - accessing private method for testing
		const result = promptManager.buildCompetencyContext({
			subject: "math",
			count: 1,
			difficulty: "Medium",
		} as GenerationParams);
		expect(result).toBe("");
	});

	test("buildCompetencyContext returns formatted string when competency data provided", () => {
		// @ts-expect-error - accessing private method for testing
		const result = promptManager.buildCompetencyContext({
			subject: "math",
			count: 1,
			difficulty: "Medium",
			topicCompetencyLevel: "proficient",
			topicCompetencyScore: 75,
		} as GenerationParams);
		expect(result).toContain(
			"Student context: The student has a proficient understanding",
		);
		expect(result).toContain("(score: 75%)");
		expect(result).toContain("Focus on the following Bloom's taxonomy levels:");
	});
});
