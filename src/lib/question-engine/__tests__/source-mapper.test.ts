import { describe, expect, test } from "bun:test";
import {
	attachWebSources,
	mapSourceRefs,
} from "@/lib/question-engine/source-mapper";
import type { Question, WebSource } from "@/lib/tinyfish";

const SOURCES: WebSource[] = [
	{
		url: "https://www.education.gov.za/Curriculum/",
		title: "DBE Curriculum",
		snippet: "...",
		content: "...",
		contentTruncated: false,
	},
	{
		url: "https://wced.school.za",
		title: "WCED Past Papers",
		snippet: "...",
		content: "...",
		contentTruncated: false,
	},
	{
		url: "https://maths4all.co.za",
		title: "Maths 4 All",
		snippet: "...",
		content: "...",
		contentTruncated: false,
	},
];

const baseQuestion = (): Question => ({
	id: "q1",
	type: "multiple-choice",
	subject: "mathematics",
	topic: "algebra",
	difficulty: "Medium",
	bloomTaxonomy: "apply",
	points: 10,
	questionText: "Q?",
	hint: "h",
	explanation: "e",
	body: {
		options: [
			{ id: "A", text: "a", isCorrect: true },
			{ id: "B", text: "b", isCorrect: false },
		],
		correctOptionId: "A",
		allowMultiple: false,
	},
});

describe("mapSourceRefs", () => {
	test("returns mapped sources for valid integer refs", () => {
		expect(mapSourceRefs([0, 2], SOURCES)).toEqual([
			{ url: SOURCES[0].url, title: SOURCES[0].title },
			{ url: SOURCES[2].url, title: SOURCES[2].title },
		]);
	});

	test("returns empty array for explicit empty refs", () => {
		expect(mapSourceRefs([], SOURCES)).toEqual([]);
	});

	test("returns undefined for non-array input", () => {
		expect(mapSourceRefs("nope", SOURCES)).toBeUndefined();
		expect(mapSourceRefs(null, SOURCES)).toBeUndefined();
		expect(mapSourceRefs(undefined, SOURCES)).toBeUndefined();
		expect(mapSourceRefs({ 0: 0 }, SOURCES)).toBeUndefined();
	});

	test("returns undefined when any ref is not an integer", () => {
		expect(mapSourceRefs([0, 1.5], SOURCES)).toBeUndefined();
		expect(mapSourceRefs([0, "1"], SOURCES)).toBeUndefined();
		expect(mapSourceRefs([0, NaN], SOURCES)).toBeUndefined();
	});

	test("returns undefined when any ref is out of range", () => {
		expect(mapSourceRefs([-1, 0], SOURCES)).toBeUndefined();
		expect(mapSourceRefs([0, 5], SOURCES)).toBeUndefined();
	});

	test("returns undefined when source has missing url/title", () => {
		const badSources = [
			{ url: "https://x", title: "x" },
			{ url: undefined, title: "y" },
		] as unknown as WebSource[];
		expect(mapSourceRefs([0, 1], badSources)).toBeUndefined();
	});
});

describe("attachWebSources", () => {
	test("uses AI-cited sourceRefs when valid", () => {
		const q = { ...baseQuestion(), sourceRefs: [1] } as Question & {
			sourceRefs?: unknown;
		};
		attachWebSources(q, { sources: SOURCES });
		expect(q.webSources).toEqual([
			{ url: SOURCES[1].url, title: SOURCES[1].title },
		]);
		expect((q as { sourceRefs?: unknown }).sourceRefs).toBeUndefined();
	});

	test("preserves explicit empty sourceRefs (no grounding)", () => {
		const q = { ...baseQuestion(), sourceRefs: [] } as Question & {
			sourceRefs?: unknown;
		};
		attachWebSources(q, { sources: SOURCES });
		expect(q.webSources).toEqual([]);
	});

	test("falls back to all sources when sourceRefs is invalid", () => {
		const q = { ...baseQuestion(), sourceRefs: [99] } as Question & {
			sourceRefs?: unknown;
		};
		attachWebSources(q, { sources: SOURCES });
		expect(q.webSources).toEqual([
			{ url: SOURCES[0].url, title: SOURCES[0].title },
			{ url: SOURCES[1].url, title: SOURCES[1].title },
			{ url: SOURCES[2].url, title: SOURCES[2].title },
		]);
		expect((q as { sourceRefs?: unknown }).sourceRefs).toBeUndefined();
	});

	test("falls back to all sources when sourceRefs is missing", () => {
		const q = baseQuestion();
		attachWebSources(q, { sources: SOURCES });
		expect(q.webSources).toEqual([
			{ url: SOURCES[0].url, title: SOURCES[0].title },
			{ url: SOURCES[1].url, title: SOURCES[1].title },
			{ url: SOURCES[2].url, title: SOURCES[2].title },
		]);
		expect((q as { sourceRefs?: unknown }).sourceRefs).toBeUndefined();
	});

	test("leaves question untouched when ragContext has no sources", () => {
		const q = { ...baseQuestion(), sourceRefs: [0] } as Question & {
			sourceRefs?: unknown;
		};
		attachWebSources(q, { sources: [] });
		expect(q.webSources).toBeUndefined();
		expect((q as { sourceRefs?: unknown }).sourceRefs).toBeUndefined();
	});

	test("leaves question untouched when ragContext is undefined", () => {
		const q = { ...baseQuestion(), sourceRefs: [0] } as Question & {
			sourceRefs?: unknown;
		};
		attachWebSources(q, undefined);
		expect(q.webSources).toBeUndefined();
		expect((q as { sourceRefs?: unknown }).sourceRefs).toBeUndefined();
	});
});
