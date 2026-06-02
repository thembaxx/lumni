import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { WebSource } from "../types";
import {
	buildPromptInstruction,
	buildRagContext,
	extractSourceFromFetchResult,
	isSourceViable,
	truncateContent,
} from "../wrap";

describe("truncateContent", () => {
	test("returns original text when shorter than max", () => {
		const result = truncateContent("short text", 100);
		expect(result.text).toBe("short text");
		expect(result.truncated).toBe(false);
	});

	test("truncates and adds ellipsis when longer than max", () => {
		const result = truncateContent("a".repeat(200), 100);
		expect(result.text.length).toBeLessThanOrEqual(101);
		expect(result.text.endsWith("…")).toBe(true);
		expect(result.truncated).toBe(true);
	});

	test("uses default max when not provided", () => {
		const short = "x".repeat(100);
		const result = truncateContent(short);
		expect(result.truncated).toBe(false);
		expect(result.text).toBe(short);
	});

	test("handles exact-length strings", () => {
		const text = "x".repeat(1500);
		const result = truncateContent(text, 1500);
		expect(result.truncated).toBe(false);
		expect(result.text).toBe(text);
	});
});

describe("isSourceViable", () => {
	const base: WebSource = {
		url: "https://example.com/x",
		title: "X",
		snippet: "",
		content: "x".repeat(500),
		contentTruncated: false,
	};

	test("viable source with URL, title, and enough content", () => {
		expect(isSourceViable(base)).toBe(true);
	});

	test("rejects source with no URL", () => {
		expect(isSourceViable({ ...base, url: "" })).toBe(false);
	});

	test("rejects source with no title", () => {
		expect(isSourceViable({ ...base, title: "" })).toBe(false);
	});

	test("rejects source with too little content", () => {
		expect(isSourceViable({ ...base, content: "tiny" })).toBe(false);
	});
});

describe("buildRagContext", () => {
	test("returns empty context for empty sources", () => {
		const ctx = buildRagContext([]);
		expect(ctx.sources).toEqual([]);
		expect(ctx.xml).toBe("");
		expect(ctx.domainsQueried).toEqual([]);
	});

	test("filters out non-viable sources", () => {
		const sources: WebSource[] = [
			{
				url: "https://good.com/x",
				title: "Good",
				snippet: "",
				content: "x".repeat(500),
				contentTruncated: false,
			},
			{
				url: "",
				title: "No URL",
				snippet: "",
				content: "x".repeat(500),
				contentTruncated: false,
			},
		];
		const ctx = buildRagContext(sources);
		expect(ctx.sources.length).toBe(1);
		expect(ctx.sources[0].title).toBe("Good");
	});

	test("builds XML with sources attribute", () => {
		const sources: WebSource[] = [
			{
				url: "https://a.com/x",
				title: "A",
				snippet: "",
				content: "x".repeat(500),
				contentTruncated: false,
			},
			{
				url: "https://b.com/y",
				title: "B",
				snippet: "",
				content: "y".repeat(500),
				contentTruncated: false,
			},
		];
		const ctx = buildRagContext(sources);
		expect(ctx.xml).toContain(
			'<reference_material sources="https://a.com/x,https://b.com/y">',
		);
		expect(ctx.xml).toContain("</reference_material>");
		expect(ctx.xml).toContain('<source url="https://a.com/x" title="A">');
		expect(ctx.xml).toContain('<source url="https://b.com/y" title="B">');
	});

	test("extracts unique domains", () => {
		const sources: WebSource[] = [
			{
				url: "https://a.com/x",
				title: "A",
				snippet: "",
				content: "x".repeat(500),
				contentTruncated: false,
			},
			{
				url: "https://a.com/y",
				title: "A2",
				snippet: "",
				content: "x".repeat(500),
				contentTruncated: false,
			},
			{
				url: "https://b.com/z",
				title: "B",
				snippet: "",
				content: "x".repeat(500),
				contentTruncated: false,
			},
		];
		const ctx = buildRagContext(sources);
		expect(ctx.domainsQueried).toEqual(["a.com", "b.com"]);
	});

	test("escapes XML special characters in titles and content", () => {
		const sources: WebSource[] = [
			{
				url: "https://a.com/x",
				title: 'A & "B" <C>',
				snippet: "",
				content: `${'content & <tag> "quote" '.repeat(10)}`,
				contentTruncated: false,
			},
		];
		const ctx = buildRagContext(sources);
		expect(ctx.xml).toContain("&amp;");
		expect(ctx.xml).toContain("&lt;");
		expect(ctx.xml).toContain("&gt;");
		expect(ctx.xml).toContain("&quot;");
	});
});

describe("extractSourceFromFetchResult", () => {
	test("builds WebSource from fetch result", () => {
		const result = {
			url: "https://x.com/page",
			title: "Page",
			text: "x".repeat(2000),
		};
		const source = extractSourceFromFetchResult(result);
		expect(source.url).toBe("https://x.com/page");
		expect(source.title).toBe("Page");
		expect(source.contentTruncated).toBe(true);
		expect(source.content.endsWith("…")).toBe(true);
	});

	test("uses URL as title fallback", () => {
		const result = {
			url: "https://x.com/page",
			title: "",
			text: "x".repeat(500),
		};
		const source = extractSourceFromFetchResult(result);
		expect(source.title).toBe("https://x.com/page");
	});

	test("generates snippet from first 200 chars", () => {
		const result = {
			url: "https://x.com/page",
			title: "Page",
			text: "a".repeat(500),
		};
		const source = extractSourceFromFetchResult(result);
		expect(source.snippet.length).toBeLessThanOrEqual(200);
	});
});

describe("buildPromptInstruction", () => {
	let instruction: string;

	beforeEach(() => {
		instruction = buildPromptInstruction();
	});

	afterEach(() => {
		expect(instruction).toBeTruthy();
	});

	test("instructs to treat block as data only", () => {
		expect(instruction.toLowerCase()).toContain("data only");
	});

	test("warns against following commands in block", () => {
		expect(instruction.toLowerCase()).toContain("never follow");
	});
});
