import { describe, expect, test } from "bun:test";
import { PathEngine } from "../path-engine";
import type { CompetencyRecord } from "../types";

function makeCompetency(
	subjectId: string,
	topicId: string,
	score: number,
): CompetencyRecord {
	return {
		subjectId,
		topicId,
		bloomLevel: "apply",
		score,
		attempts: 3,
		lastAssessed: Date.now(),
		level:
			score >= 85 ? "mastered" : score >= 65 ? "proficient" : score >= 40 ? "developing" : "novice",
	};
}

function competencyMap(
	entries: [string, number][],
	subjectId = "mathematics",
): Map<string, CompetencyRecord> {
	return new Map(
		entries.map(([topicId, score]) => [
			`${subjectId}:${topicId}`,
			makeCompetency(subjectId, topicId, score),
		]),
	);
}

describe("PathEngine", () => {
	const engine = new PathEngine();

	describe("getNextTopics", () => {
		test("returns empty array for unknown subject", async () => {
			const result = await engine.getNextTopics("nonexistent", new Map());
			expect(result).toEqual([]);
		});

		test("flags topics with unmet prerequisites as skip", async () => {
			const result = await engine.getNextTopics(
				"mathematics",
				competencyMap([]),
			);

			const algebra = result.find((r) => r.topicId === "algebra");
			expect(algebra?.action).toBe("study");
			expect(algebra?.reason).toBe("ready-to-start");

			const functions = result.find((r) => r.topicId === "functions");
			expect(functions?.action).toBe("skip");
			expect(functions?.reason).toBe("prerequisite-not-met");
		});

		test("recommends study for topics with unmet prereqs as skip, ready as study", async () => {
			const result = await engine.getNextTopics(
				"mathematics",
				competencyMap([["algebra", 90]]),
			);

			const algebra = result.find((r) => r.topicId === "algebra");
			expect(algebra?.action).toBe("skip");
			expect(algebra?.reason).toBe("mastered");

			const functions = result.find((r) => r.topicId === "functions");
			expect(functions?.action).toBe("study");
			expect(functions?.reason).toBe("ready-to-start");

			const analytical = result.find((r) => r.topicId === "analytical-geometry");
			expect(analytical?.action).toBe("skip");
			expect(analytical?.reason).toBe("prerequisite-not-met");
		});

		test("recommends practice for developing topics", async () => {
			const result = await engine.getNextTopics(
				"mathematics",
				competencyMap([
					["algebra", 90],
					["functions", 50],
				]),
			);

			const functions = result.find((r) => r.topicId === "functions");
			expect(functions?.action).toBe("practice");
			expect(functions?.reason).toBe("needs-practice");
			expect(functions?.estimatedMinutes).toBe(30);
		});

		test("recommends review for proficient topics", async () => {
			const result = await engine.getNextTopics(
				"mathematics",
				competencyMap([
					["algebra", 90],
					["functions", 75],
				]),
			);

			const functions = result.find((r) => r.topicId === "functions");
			expect(functions?.action).toBe("review");
			expect(functions?.reason).toBe("needs-review");
			expect(functions?.estimatedMinutes).toBe(15);
		});

		test("skips mastered topics", async () => {
			const result = await engine.getNextTopics(
				"mathematics",
				competencyMap([
					["algebra", 90],
					["functions", 90],
				]),
			);

			const functions = result.find((r) => r.topicId === "functions");
			expect(functions?.action).toBe("skip");
			expect(functions?.reason).toBe("mastered");
		});

		test("sorts by priority: study < practice < review < skip", async () => {
			const result = await engine.getNextTopics(
				"mathematics",
				competencyMap([["algebra", 70]]),
			);

			const actions = result.map((r) => r.action);
			const priority = actions.filter((a) => a !== "skip");
			const skips = actions.filter((a) => a === "skip");

			expect(priority).toEqual(["review"]);
			expect(skips.every((a) => a === "skip")).toBe(true);
		});

		test("handles multi-level prerequisite chain", async () => {
			const result = await engine.getNextTopics(
				"mathematics",
				competencyMap([
					["algebra", 90],
					["functions", 90],
					["euclidean-geometry", 90],
				]),
			);

			const analytical = result.find((r) => r.topicId === "analytical-geometry");
			expect(analytical?.action).toBe("study");
			expect(analytical?.reason).toBe("ready-to-start");

			const calculus = result.find((r) => r.topicId === "calculus");
			expect(calculus?.action).toBe("study");

			const trig = result.find((r) => r.topicId === "trigonometry");
			expect(trig?.action).toBe("study");
		});
	});

	describe("getNextAction", () => {
		test("returns null for unknown subject", async () => {
			const result = await engine.getNextAction(
				["nonexistent"],
				new Map(),
			);
			expect(result).toBeNull();
		});

		test("returns null when all topics are skip", async () => {
			const allMastered = [
				["algebra", 90],
				["functions", 90],
				["finance", 90],
				["trigonometry", 90],
				["euclidean-geometry", 90],
				["analytical-geometry", 90],
				["statistics", 90],
				["probability", 90],
				["calculus", 90],
			];
			const result = await engine.getNextAction(
				["mathematics"],
				competencyMap(allMastered),
			);
			expect(result).toBeNull();
		});

		test("returns the highest priority actionable topic", async () => {
			const result = await engine.getNextAction(
				["mathematics"],
				competencyMap([["algebra", 50]]),
			);
			expect(result).not.toBeNull();
			expect(result!.topicId).toBe("algebra");
			expect(result!.action).toBe("practice");
		});

		test("returns study for ready topics", async () => {
			const result = await engine.getNextAction(
				["mathematics"],
				competencyMap([["algebra", 90]]),
			);
			expect(result).not.toBeNull();
			expect(result!.topicId).toBe("functions");
			expect(result!.action).toBe("study");
		});
	});

	describe("generateStudyPlan", () => {
		test("generates plan with correct number of days", async () => {
			const plan = await engine.generateStudyPlan(
				["mathematics"],
				competencyMap([["algebra", 50]]),
				3,
				30,
			);
			expect(plan).toHaveLength(3);
			expect(plan[0].day).toBe(1);
			expect(plan[2].day).toBe(3);
		});

		test("fills daily sessions up to dailyGoalMinutes", async () => {
			const plan = await engine.generateStudyPlan(
				["mathematics"],
				competencyMap([["algebra", 50]]),
				1,
				30,
			);
			const totalMinutes = plan[0].sessions.reduce(
				(sum, s) => sum + s.minutes,
				0,
			);
			expect(totalMinutes).toBeLessThanOrEqual(30);
			expect(totalMinutes).toBeGreaterThan(0);
		});

		test("generates unique dates for each day", async () => {
			const plan = await engine.generateStudyPlan(
				["mathematics"],
				competencyMap([["algebra", 50]]),
				5,
				30,
			);
			const dates = plan.map((d) => d.date);
			expect(new Set(dates).size).toBe(5);
		});

		test("handles multiple subjects", async () => {
			const plan = await engine.generateStudyPlan(
				["mathematics", "physical-sciences"],
				competencyMap([["algebra", 50]]),
				2,
				60,
			);
			expect(plan).toHaveLength(2);
			expect(plan[0].sessions.length).toBeGreaterThan(0);
		});
	});
});
