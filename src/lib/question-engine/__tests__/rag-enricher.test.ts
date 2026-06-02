import { describe, expect, mock, test } from "bun:test";

const { fetchRagContext, RAG_TIMEOUT_MS } = await import("../rag-enricher");

function emptyRag() {
	return { sources: [], xml: "", domainsQueried: [] };
}

function ragWithSources() {
	return {
		sources: [
			{
				url: "https://example.com",
				title: "Example",
				snippet: "x",
				content: "content ".repeat(50),
				contentTruncated: false,
			},
		],
		xml: '<reference_material sources="https://example.com">\n<source url="https://example.com" title="Example">\ncontent\n</source>\n</reference_material>',
		domainsQueried: ["example.com"],
	};
}

describe("fetchRagContext", () => {
	test("returns empty context when subject is missing", async () => {
		const result = await fetchRagContext("", "topic", "user-1", {
			searchWithRAG: undefined as never,
		});
		expect(result).toEqual(emptyRag());
	});

	test("returns empty context when topic is empty", async () => {
		const result = await fetchRagContext("mathematics", "", "user-1", {
			searchWithRAG: undefined as never,
		});
		expect(result).toEqual(emptyRag());
	});

	test("returns empty context when topic is whitespace only", async () => {
		const result = await fetchRagContext("mathematics", "   ", "user-1", {
			searchWithRAG: undefined as never,
		});
		expect(result).toEqual(emptyRag());
	});

	test("calls searchWithRAG with subject, topic, and userId", async () => {
		const mockRag = await import("@/lib/tinyfish");
		const spy = mock(async () => ragWithSources());
		const result = await fetchRagContext("mathematics", "algebra", "user-1", {
			searchWithRAG: spy as never,
		});
		expect(spy).toHaveBeenCalledWith({
			subject: "mathematics",
			topic: "algebra",
			userId: "user-1",
		});
		expect(result).toEqual(ragWithSources());
		void mockRag;
	});

	test("passes userId=undefined when null is provided", async () => {
		const spy = mock(async () => ragWithSources());
		await fetchRagContext("mathematics", "algebra", null, {
			searchWithRAG: spy as never,
		});
		expect(spy).toHaveBeenCalledWith({
			subject: "mathematics",
			topic: "algebra",
			userId: undefined,
		});
	});

	test("fail-open: returns empty context on searchWithRAG rejection", async () => {
		const spy = mock(async () => {
			throw new Error("network down");
		});
		const result = await fetchRagContext("mathematics", "algebra", "user-1", {
			searchWithRAG: spy as never,
		});
		expect(result).toEqual(emptyRag());
	});

	test("fail-open: returns empty context on timeout", async () => {
		const spy = mock(
			() => new Promise((resolve) => setTimeout(resolve, RAG_TIMEOUT_MS + 100)),
		);
		const result = await fetchRagContext("mathematics", "algebra", "user-1", {
			searchWithRAG: spy as never,
		});
		expect(result).toEqual(emptyRag());
	});

	test("RAG_TIMEOUT_MS is 3000ms", () => {
		expect(RAG_TIMEOUT_MS).toBe(3000);
	});
});
