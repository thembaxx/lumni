import { describe, expect, test } from "bun:test";
import {
	allocateDailyMinutes,
	calculateSubjectWeights,
	generateStudyPlan,
} from "../algorithms";
import type { StudyPlanSettings, SubjectCompetency } from "../types";

describe("calculateSubjectWeights", () => {
	test("returns equal weights when all subjects have same level", () => {
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "math",
				level: 50,
				targetLevel: 80,
				weight: 0,
				topics: ["a"],
			},
			{
				subjectId: "eng",
				level: 50,
				targetLevel: 80,
				weight: 0,
				topics: ["b"],
			},
		];
		const weights = calculateSubjectWeights(subjects, 25);
		expect(weights).toHaveLength(2);
		expect(weights[0]).toBeCloseTo(0.5, 5);
		expect(weights[1]).toBeCloseTo(0.5, 5);
	});

	test("weights weaker subjects higher", () => {
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "weak",
				level: 20,
				targetLevel: 80,
				weight: 0,
				topics: ["a"],
			},
			{
				subjectId: "strong",
				level: 80,
				targetLevel: 80,
				weight: 0,
				topics: ["b"],
			},
		];
		const weights = calculateSubjectWeights(subjects, 25);
		expect(weights[0]).toBeGreaterThan(weights[1]);
	});

	test("weights sum to 1", () => {
		const subjects: SubjectCompetency[] = [
			{ subjectId: "a", level: 10, targetLevel: 80, weight: 0, topics: ["a"] },
			{ subjectId: "b", level: 30, targetLevel: 80, weight: 0, topics: ["b"] },
			{ subjectId: "c", level: 60, targetLevel: 80, weight: 0, topics: ["c"] },
			{ subjectId: "d", level: 90, targetLevel: 80, weight: 0, topics: ["d"] },
		];
		const weights = calculateSubjectWeights(subjects, 25);
		const sum = weights.reduce((s, w) => s + w, 0);
		expect(sum).toBeCloseTo(1, 5);
	});

	test("handles single subject", () => {
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "math",
				level: 50,
				targetLevel: 80,
				weight: 0,
				topics: ["a"],
			},
		];
		const weights = calculateSubjectWeights(subjects, 25);
		expect(weights).toHaveLength(1);
		expect(weights[0]).toBeCloseTo(1, 5);
	});

	test("clamps minimum level to 0.1 to avoid division by zero", () => {
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "zero",
				level: 0,
				targetLevel: 80,
				weight: 0,
				topics: ["a"],
			},
			{
				subjectId: "normal",
				level: 50,
				targetLevel: 80,
				weight: 0,
				topics: ["b"],
			},
		];
		const weights = calculateSubjectWeights(subjects, 25);
		expect(weights[0]).toBeGreaterThan(0);
		expect(weights[0]).toBeGreaterThan(weights[1]);
	});
});

describe("allocateDailyMinutes", () => {
	const settings: StudyPlanSettings = {
		targetAps: 25,
		dailyStudyMinutes: 60,
		preferredStudyTime: "morning",
		studyDays: [1, 2, 3, 4, 5],
		startDate: "2026-01-01",
		endDate: "2026-01-31",
	};

	test("allocates minutes proportional to weights", () => {
		const weights = [0.6, 0.4];
		const minutes = allocateDailyMinutes(settings, weights);
		expect(minutes).toHaveLength(2);
		expect(minutes[0]).toBe(36);
		expect(minutes[1]).toBe(24);
	});

	test("allocated minutes sum to dailyStudyMinutes", () => {
		const weights = [0.25, 0.25, 0.25, 0.25];
		const minutes = allocateDailyMinutes(settings, weights);
		const sum = minutes.reduce((s, m) => s + m, 0);
		expect(sum).toBe(60);
	});

	test("handles single weight", () => {
		const minutes = allocateDailyMinutes(settings, [1]);
		expect(minutes[0]).toBe(60);
	});
});

describe("generateStudyPlan", () => {
	const baseSettings: StudyPlanSettings = {
		targetAps: 25,
		dailyStudyMinutes: 60,
		preferredStudyTime: "morning",
		studyDays: [1, 2, 3, 4, 5],
		startDate: "2026-01-05",
		endDate: "2026-01-09",
	};

	test("returns a study plan with correct structure", async () => {
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "mathematics",
				level: 50,
				targetLevel: 80,
				weight: 0,
				topics: ["algebra", "calculus"],
			},
		];
		const plan = await generateStudyPlan(baseSettings, subjects);
		expect(plan).toHaveProperty("settings");
		expect(plan).toHaveProperty("subjects");
		expect(plan).toHaveProperty("topics");
		expect(plan).toHaveProperty("totalEstimatedMinutes");
		expect(plan).toHaveProperty("progress");
		expect(plan.progress).toBe(0);
	});

	test("schedules topics across valid weekdays only", async () => {
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "mathematics",
				level: 50,
				targetLevel: 80,
				weight: 0,
				topics: ["algebra", "calculus", "geometry", "trig", "stats"],
			},
		];
		// Jan 5 2026 is a Monday, Jan 9 is Friday — 5 weekdays
		const plan = await generateStudyPlan(baseSettings, subjects);
		const scheduledDates = plan.topics.flatMap((t) =>
			t.scheduledDate ? [t.scheduledDate] : [],
		);
		expect(scheduledDates.length).toBe(5);
		for (const date of scheduledDates) {
			const day = new Date(date as string).getDay();
			expect([1, 2, 3, 4, 5]).toContain(day);
		}
	});

	test("distributes topics across subjects based on weights", async () => {
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "mathematics",
				level: 30,
				targetLevel: 80,
				weight: 0,
				topics: ["algebra"],
			},
			{
				subjectId: "english",
				level: 70,
				targetLevel: 80,
				weight: 0,
				topics: ["grammar"],
			},
		];
		const plan = await generateStudyPlan(baseSettings, subjects);
		expect(plan.topics.length).toBe(2);
		const mathTopics = plan.topics.filter((t) => t.subjectId === "mathematics");
		const englishTopics = plan.topics.filter((t) => t.subjectId === "english");
		// Weaker subject gets more minutes per topic
		expect(mathTopics[0].estimatedMinutes).toBeGreaterThan(
			englishTopics[0].estimatedMinutes,
		);
	});

	test("handles subjects with no topics", async () => {
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "mathematics",
				level: 50,
				targetLevel: 80,
				weight: 0,
				topics: [],
			},
		];
		const plan = await generateStudyPlan(baseSettings, subjects);
		expect(plan.topics).toHaveLength(0);
		expect(plan.totalEstimatedMinutes).toBe(0);
	});

	test("excludes non-study days", async () => {
		const weekendSettings: StudyPlanSettings = {
			...baseSettings,
			startDate: "2026-01-03",
			endDate: "2026-01-04",
			studyDays: [0, 6],
		};
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "mathematics",
				level: 50,
				targetLevel: 80,
				weight: 0,
				topics: ["algebra", "calculus"],
			},
		];
		const plan = await generateStudyPlan(weekendSettings, subjects);
		// Jan 3 2026 = Saturday (6), Jan 4 2026 = Sunday (0)
		const scheduledDates = plan.topics.flatMap((t) =>
			t.scheduledDate ? [t.scheduledDate] : [],
		);
		for (const date of scheduledDates) {
			const day = new Date(date as string).getDay();
			expect([0, 6]).toContain(day);
		}
	});

	test("sets isCompleted to false and actualMinutesSpent to 0 for all topics", async () => {
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "mathematics",
				level: 50,
				targetLevel: 80,
				weight: 0,
				topics: ["algebra"],
			},
		];
		const plan = await generateStudyPlan(baseSettings, subjects);
		for (const topic of plan.topics) {
			expect(topic.isCompleted).toBe(false);
			expect(topic.actualMinutesSpent).toBe(0);
		}
	});

	test("preserves settings in the plan output", async () => {
		const subjects: SubjectCompetency[] = [
			{
				subjectId: "mathematics",
				level: 50,
				targetLevel: 80,
				weight: 0,
				topics: ["algebra"],
			},
		];
		const plan = await generateStudyPlan(baseSettings, subjects);
		expect(plan.settings.targetAps).toBe(baseSettings.targetAps);
		expect(plan.settings.dailyStudyMinutes).toBe(
			baseSettings.dailyStudyMinutes,
		);
		expect(plan.settings.studyDays).toEqual(baseSettings.studyDays);
	});
});
